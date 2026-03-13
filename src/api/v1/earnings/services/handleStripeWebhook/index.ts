import { BadRequestError, ControllerArgs, HttpStatus, logger } from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { EarningsRepository } from '../../repository';
import { mergeStripeMetadata, verifyStripeWebhookSignature } from '../../utils/stripe';

type StripeWebhookEvent = {
    id?: string;
    type?: string;
    data?: {
        object?: Record<string, any>;
    };
};

export class HandleStripeWebhook {
    constructor(private readonly earningsRepository: EarningsRepository) {}

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
        const metadata = object.metadata ?? {};
        const paymentId = metadata.paymentId ?? metadata.payment_id ?? object.client_reference_id ?? null;

        if (!event?.type) {
            throw new BadRequestError('Stripe event type is missing.');
        }

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
                stripeCheckoutSessionId: event.type.startsWith('checkout.session') ? object.id ?? null : currentMetadata.stripeCheckoutSessionId ?? null,
                stripePaymentIntentId:
                    (typeof object.payment_intent === 'string' && object.payment_intent) ||
                    currentMetadata.stripePaymentIntentId ||
                    null,
                stripePaymentStatus: object.payment_status ?? object.status ?? null,
            }),
        });

        if (nextStatus === 'processing' && payment.status !== 'processing') {
            await notificationDispatcher.dispatch({
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
            });
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
}

const handleStripeWebhook = new HandleStripeWebhook(new EarningsRepository());

export default handleStripeWebhook;
