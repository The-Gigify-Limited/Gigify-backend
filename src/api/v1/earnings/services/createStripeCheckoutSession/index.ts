import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, ServerError, UnAuthorizedError, logger } from '@/core';
import { GigRepository } from '~/gigs/repository';
import { UserRepository } from '~/user/repository';
import { CreateStripeCheckoutSessionDto } from '../../interfaces';
import { EarningsRepository } from '../../repository';
import { createStripeCheckoutSession as createHostedStripeCheckoutSession, mergeStripeMetadata } from '../../utils/stripe';

export class CreateStripeCheckoutSession {
    constructor(
        private readonly earningsRepository: EarningsRepository,
        private readonly gigRepository: GigRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ input, request }: ControllerArgs<CreateStripeCheckoutSessionDto>) => {
        const employerId = request.user?.id;

        if (!employerId) throw new UnAuthorizedError('User not authenticated');
        if (!input?.talentId) throw new BadRequestError('Talent ID is required');
        if (!input.amount || input.amount <= 0) throw new BadRequestError('Payment amount must be greater than zero');

        const gig = input.gigId ? await this.gigRepository.getGigById(input.gigId) : null;

        if (input.gigId && !gig) {
            throw new RouteNotFoundError('Gig not found');
        }

        if (gig && gig.employerId !== employerId) {
            throw new ConflictError('You do not own this gig');
        }

        const existingPayment = input.paymentId
            ? await this.earningsRepository.getPaymentById(input.paymentId)
            : await this.earningsRepository.findPendingPaymentByContext({
                  applicationId: input.applicationId,
                  gigId: input.gigId,
                  talentId: input.talentId,
              });

        if (existingPayment && existingPayment.employerId !== employerId) {
            throw new ConflictError('You do not own this payment');
        }

        if (existingPayment?.status === 'processing') {
            throw new ConflictError('Escrow funding has already been completed for this payment.');
        }

        if (existingPayment?.status === 'paid') {
            throw new ConflictError('This payment has already been released.');
        }

        const baseMetadata = mergeStripeMetadata(existingPayment?.metadata, {
            stripeCheckoutStatus: 'initiated',
        });

        const payment =
            existingPayment && existingPayment.id
                ? await this.earningsRepository.updatePayment(existingPayment.id, {
                      amount: input.amount,
                      currency: input.currency ?? existingPayment.currency,
                      platformFee: input.platformFee ?? existingPayment.platformFee,
                      provider: 'stripe',
                      paymentReference: null,
                      status: 'pending',
                      metadata: baseMetadata,
                  })
                : await this.earningsRepository.createPayment({
                      employerId,
                      talentId: input.talentId,
                      amount: input.amount,
                      applicationId: input.applicationId,
                      currency: input.currency,
                      gigId: input.gigId,
                      platformFee: input.platformFee,
                      provider: 'stripe',
                      status: 'pending',
                      metadata: baseMetadata,
                  });

        const employerRow = await this.userRepository.findById(employerId);
        const employer = employerRow ? this.userRepository.mapToCamelCase(employerRow) : null;

        try {
            const session = await createHostedStripeCheckoutSession({
                paymentId: payment.id,
                employerId,
                talentId: payment.talentId,
                amount: Number(payment.amount),
                currency: payment.currency,
                customerEmail: employer?.email ?? request.user?.email ?? null,
                successUrl: input.successUrl ?? null,
                cancelUrl: input.cancelUrl ?? null,
                productName: gig?.title ?? 'Gigify escrow funding',
                productDescription: gig ? `Fund escrow for "${gig.title}" on Gigify.` : 'Fund escrow for a Gigify booking.',
            });

            const updatedPayment = await this.earningsRepository.updatePayment(payment.id, {
                paymentReference: session.payment_intent ?? session.id,
                metadata: mergeStripeMetadata(payment.metadata, {
                    stripeCheckoutStatus: 'created',
                    stripeCheckoutSessionId: session.id,
                    stripeCheckoutUrl: session.url,
                    stripeCustomerEmail: session.customer_email ?? employer?.email ?? request.user?.email ?? null,
                    stripePaymentIntentId: session.payment_intent ?? null,
                    stripePaymentStatus: session.payment_status ?? null,
                    stripeCheckoutExpiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
                }),
            });

            return {
                code: HttpStatus.CREATED,
                message: 'Stripe Checkout Session Created Successfully',
                data: {
                    payment: updatedPayment,
                    checkout: {
                        sessionId: session.id,
                        url: session.url,
                        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
                    },
                },
            };
        } catch (error: any) {
            logger.error('Stripe checkout session creation failed', {
                employerId,
                paymentId: payment.id,
                error: error?.message,
                status: error?.response?.status,
            });

            throw new ServerError('Unable to create Stripe checkout session right now.');
        }
    };
}

const createStripeCheckoutSession = new CreateStripeCheckoutSession(new EarningsRepository(), new GigRepository(), new UserRepository());

export default createStripeCheckoutSession;
