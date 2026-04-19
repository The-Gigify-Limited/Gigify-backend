import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus, logger } from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { GigRepository } from '~/gigs/repository';
import { DisputeRepository, EarningsRepository } from '../../repository';
import { DisputeStatusEnum, Payment } from '../../interfaces';
import { mergeStripeMetadata, verifyStripeWebhookSignature } from '../../utils/stripe';

type StripeWebhookEvent = {
    id?: string;
    type?: string;
    data?: {
        object?: Record<string, any>;
    };
};

export class HandleStripeWebhook {
    constructor(
        private readonly earningsRepository: EarningsRepository,
        private readonly disputeRepository: DisputeRepository = new DisputeRepository(),
        private readonly gigRepository: GigRepository = new GigRepository(),
    ) {}

    handle = async ({ headers, request }: ControllerArgs) => {
        if (!request.rawBody) {
            throw new BadRequestError('Missing raw Stripe webhook payload.');
        }

        verifyStripeWebhookSignature({
            rawBody: request.rawBody,
            signatureHeader: headers['stripe-signature'],
        });

        const event = request.body as StripeWebhookEvent;
        const object = event?.data?.object ?? {};

        if (!event?.type) {
            throw new BadRequestError('Stripe event type is missing.');
        }

        // Dispute events arrive on a charge.dispute object, not a checkout /
        // payment_intent object, so metadata / client_reference_id are not
        // populated. Handle them on a separate path that resolves the payment
        // via the attached payment_intent.
        if (event.type === 'charge.dispute.created' || event.type === 'charge.dispute.closed') {
            return this.handleDisputeEvent(event, object);
        }

        const metadata = object.metadata ?? {};
        const paymentId = metadata.paymentId ?? metadata.payment_id ?? object.client_reference_id ?? null;

        if (!paymentId) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: false,
                    eventType: event.type,
                },
            };
        }

        const payment = await this.earningsRepository.getPaymentById(paymentId);

        if (!payment) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: false,
                    eventType: event.type,
                    paymentId,
                },
            };
        }

        const nextStatus = this.mapEventToPaymentStatus(event.type);

        if (!nextStatus) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: false,
                    eventType: event.type,
                    paymentId,
                },
            };
        }

        const currentMetadata =
            payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
                ? (payment.metadata as Record<string, unknown>)
                : {};

        const updatedPayment = await this.earningsRepository.updatePayment(payment.id, {
            provider: 'stripe',
            status: nextStatus,
            paymentReference:
                (typeof object.payment_intent === 'string' && object.payment_intent) ||
                payment.paymentReference ||
                (typeof object.id === 'string' ? object.id : null),
            metadata: mergeStripeMetadata(payment.metadata, {
                lastStripeEventId: event.id ?? null,
                lastStripeEventType: event.type,
                stripeCheckoutSessionId: event.type.startsWith('checkout.session')
                    ? object.id ?? null
                    : currentMetadata.stripeCheckoutSessionId ?? null,
                stripePaymentIntentId:
                    (typeof object.payment_intent === 'string' && object.payment_intent) || currentMetadata.stripePaymentIntentId || null,
                stripePaymentStatus: object.payment_status ?? object.status ?? null,
            }),
        });

        if (nextStatus === 'processing' && payment.status !== 'processing') {
            await Promise.all([
                notificationDispatcher.dispatch({
                    userId: payment.talentId,
                    type: 'payment_update',
                    title: 'Escrow funded',
                    message: 'Your employer has funded this booking and payment is now held in escrow.',
                    payload: {
                        paymentId: updatedPayment.id,
                        gigId: updatedPayment.gigId,
                        status: updatedPayment.status,
                    },
                    preferenceKey: 'paymentUpdates',
                }),
                dispatch('earnings:payment-held', {
                    paymentId: updatedPayment.id,
                    employerId: updatedPayment.employerId,
                    talentId: updatedPayment.talentId,
                    gigId: updatedPayment.gigId,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                }),
            ]);
        }

        logger.info('Stripe webhook processed', {
            eventType: event.type,
            paymentId: payment.id,
            status: updatedPayment.status,
        });

        return {
            code: HttpStatus.OK,
            message: 'Stripe Webhook Processed Successfully',
            data: {
                acknowledged: true,
                handled: true,
                eventType: event.type,
                paymentId: updatedPayment.id,
                status: updatedPayment.status,
            },
        };
    };

    private mapEventToPaymentStatus(eventType: string) {
        switch (eventType) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
                return 'processing' as const;
            case 'checkout.session.expired':
            case 'payment_intent.canceled':
                return 'cancelled' as const;
            case 'payment_intent.payment_failed':
            case 'checkout.session.async_payment_failed':
                return 'failed' as const;
            case 'charge.refunded':
                return 'refunded' as const;
            default:
                return null;
        }
    }

    private async handleDisputeEvent(event: StripeWebhookEvent, object: Record<string, any>) {
        const intentId = typeof object.payment_intent === 'string' ? object.payment_intent : null;
        const notHandled = (reason: string) => ({
            code: HttpStatus.OK,
            message: 'Stripe Webhook Processed Successfully',
            data: {
                acknowledged: true,
                handled: false,
                eventType: event.type,
                reason,
            },
        });

        if (!intentId) return notHandled('missing payment_intent on dispute object');

        const payment = await this.earningsRepository.findPaymentByStripeIntent(intentId);
        if (!payment) return notHandled('no matching payment for the dispute payment_intent');

        if (event.type === 'charge.dispute.created') {
            return this.handleDisputeCreated(event, object, payment);
        }

        // charge.dispute.closed
        return this.handleDisputeClosed(event, object, payment);
    }

    private async handleDisputeCreated(event: StripeWebhookEvent, object: Record<string, any>, payment: Payment) {
        const existing = await this.disputeRepository.findLatestDisputeForPayment(payment.id);
        const terminalStates = new Set(['resolved_talent', 'resolved_employer', 'withdrawn']);

        // If a dispute is already open for this payment, Stripe's webhook is
        // arriving after a talent/employer opened it manually; treat this as
        // an idempotent no-op rather than creating a duplicate.
        if (existing && !terminalStates.has(existing.status)) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: true,
                    eventType: event.type,
                    disputeId: existing.id,
                    note: 'dispute already exists',
                },
            };
        }

        const stripeDisputeId = typeof object.id === 'string' ? object.id : null;
        const reason = (typeof object.reason === 'string' && object.reason) || 'stripe_chargeback';
        const description = stripeDisputeId ? `Stripe chargeback ${stripeDisputeId}` : 'Stripe chargeback';

        const dispute = await this.disputeRepository.createDispute({
            paymentId: payment.id,
            gigId: payment.gigId,
            raisedBy: null,
            reason,
            description,
            status: 'open',
        });

        if (payment.gigId) {
            try {
                await this.gigRepository.updateGigById(payment.gigId, { status: 'disputed' as never });
            } catch (error) {
                logger.warn('Failed to mark gig disputed from Stripe webhook', { gigId: payment.gigId, error: String(error) });
            }
        }

        await dispatch('earnings:dispute-opened', {
            disputeId: dispute.id,
            paymentId: payment.id,
            gigId: payment.gigId,
            raisedBy: null,
        });

        logger.info('Stripe dispute mirrored to internal disputes table', {
            paymentId: payment.id,
            stripeDisputeId,
            disputeId: dispute.id,
        });

        return {
            code: HttpStatus.OK,
            message: 'Stripe Webhook Processed Successfully',
            data: {
                acknowledged: true,
                handled: true,
                eventType: event.type,
                disputeId: dispute.id,
            },
        };
    }

    private async handleDisputeClosed(event: StripeWebhookEvent, object: Record<string, any>, payment: Payment) {
        const existing = await this.disputeRepository.findLatestDisputeForPayment(payment.id);
        if (!existing) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: false,
                    eventType: event.type,
                    reason: 'no internal dispute row to close',
                },
            };
        }

        const terminalStates = new Set(['resolved_talent', 'resolved_employer', 'withdrawn']);
        if (terminalStates.has(existing.status)) {
            return {
                code: HttpStatus.OK,
                message: 'Stripe Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: true,
                    eventType: event.type,
                    disputeId: existing.id,
                    note: 'dispute already resolved',
                },
            };
        }

        // In Stripe terms the merchant (us) is the side defending the charge:
        //  won              -> merchant kept funds                -> resolved_talent
        //                     (escrow continues; talent still to be paid)
        //  lost             -> customer refunded by Stripe       -> resolved_employer
        //                     (money went back to employer)
        //  warning_closed   -> informational, no funds moved     -> withdrawn
        const stripeStatus = typeof object.status === 'string' ? object.status : '';
        let resolution: Extract<DisputeStatusEnum, 'resolved_talent' | 'resolved_employer' | 'withdrawn'>;

        if (stripeStatus === 'won') {
            resolution = 'resolved_talent';
        } else if (stripeStatus === 'lost') {
            resolution = 'resolved_employer';
        } else {
            // warning_closed or anything else we don't yet handle explicitly
            resolution = 'withdrawn';
        }

        const stripeDisputeId = typeof object.id === 'string' ? object.id : null;
        const adminNotesSuffix = stripeDisputeId ? `\nStripe dispute ${stripeDisputeId} closed as ${stripeStatus || 'unknown'}` : '';

        const updated = await this.disputeRepository.updateDispute(existing.id, {
            status: resolution,
            resolvedAt: new Date().toISOString(),
            resolvedBy: null,
            adminNotes: (existing.adminNotes ?? '') + adminNotesSuffix,
        });

        if (payment.gigId) {
            const nextGigStatus = resolution === 'resolved_employer' ? 'cancelled' : resolution === 'resolved_talent' ? 'completed' : 'in_progress';
            try {
                await this.gigRepository.updateGigById(payment.gigId, { status: nextGigStatus as never });
            } catch (error) {
                logger.warn('Failed to revert gig status after Stripe dispute close', { gigId: payment.gigId, error: String(error) });
            }
        }

        await dispatch('earnings:dispute-resolved', {
            disputeId: updated.id,
            paymentId: payment.id,
            gigId: payment.gigId,
            resolution,
            resolvedBy: null,
        });

        logger.info('Stripe dispute close mirrored to internal dispute', {
            paymentId: payment.id,
            stripeDisputeId,
            disputeId: updated.id,
            resolution,
        });

        return {
            code: HttpStatus.OK,
            message: 'Stripe Webhook Processed Successfully',
            data: {
                acknowledged: true,
                handled: true,
                eventType: event.type,
                disputeId: updated.id,
                resolution,
            },
        };
    }
}

const handleStripeWebhook = new HandleStripeWebhook(new EarningsRepository());

export default handleStripeWebhook;
