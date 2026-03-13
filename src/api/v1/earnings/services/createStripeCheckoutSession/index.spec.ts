jest.mock('@/core', () => {
    class BaseRepository {}
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class ServerError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        BaseRepository,
        ConflictError,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        ServerError,
        UnAuthorizedError,
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('../../utils/stripe', () => ({
    createStripeCheckoutSession: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
        payment_intent: 'pi_123',
        payment_status: 'unpaid',
        expires_at: 1_710_000_000,
        customer_email: 'pulse@example.com',
    }),
    mergeStripeMetadata: jest.fn((current, next) => ({
        ...(current ?? {}),
        ...next,
    })),
}));

import { CreateStripeCheckoutSession } from './index';
import { createStripeCheckoutSession as createHostedStripeCheckoutSession } from '../../utils/stripe';

describe('CreateStripeCheckoutSession service', () => {
    it('creates a Stripe checkout session for a pending escrow payment', async () => {
        const earningsRepository = {
            findPendingPaymentByContext: jest.fn().mockResolvedValue(null),
            createPayment: jest.fn().mockResolvedValue({
                id: 'payment-1',
                talentId: 'talent-1',
                amount: 180000,
                currency: 'NGN',
                platformFee: 10000,
                metadata: {},
            }),
            updatePayment: jest
                .fn()
                .mockResolvedValueOnce({
                    id: 'payment-1',
                    talentId: 'talent-1',
                    amount: 180000,
                    currency: 'NGN',
                    platformFee: 10000,
                    metadata: {},
                })
                .mockResolvedValueOnce({
                    id: 'payment-1',
                    status: 'pending',
                    paymentReference: 'pi_123',
                }),
        };
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Afrobeat Night Drummer',
            }),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'employer-1',
                email: 'pulse@example.com',
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'employer-1',
                email: 'pulse@example.com',
            }),
        };

        const service = new CreateStripeCheckoutSession(earningsRepository as never, gigRepository as never, userRepository as never);

        const response = await service.handle({
            input: {
                gigId: 'gig-1',
                talentId: 'talent-1',
                amount: 180000,
                currency: 'NGN',
            },
            request: {
                user: {
                    id: 'employer-1',
                    email: 'pulse@example.com',
                },
            },
        } as never);

        expect(createHostedStripeCheckoutSession).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentId: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                customerEmail: 'pulse@example.com',
            }),
        );
        expect(response.message).toBe('Stripe Checkout Session Created Successfully');
        expect(response.data.checkout.sessionId).toBe('cs_test_123');
    });
});
