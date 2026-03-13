jest.mock('@/core', () => {
    class BaseRepository {}
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        BaseRepository,
        HttpStatus: { OK: 200 },
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../../utils/stripe', () => ({
    mergeStripeMetadata: jest.fn((current, next) => ({
        ...(current ?? {}),
        ...next,
    })),
    verifyStripeWebhookSignature: jest.fn(),
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { HandleStripeWebhook } from './index';
import { verifyStripeWebhookSignature } from '../../utils/stripe';

describe('HandleStripeWebhook service', () => {
    it('marks a Stripe-funded payment as processing and notifies the talent', async () => {
        const earningsRepository = {
            getPaymentById: jest.fn().mockResolvedValue({
                id: 'payment-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                amount: 180000,
                currency: 'NGN',
                paymentReference: null,
                provider: 'stripe',
                status: 'pending',
                metadata: {},
            }),
            updatePayment: jest.fn().mockResolvedValue({
                id: 'payment-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                status: 'processing',
            }),
        };

        const service = new HandleStripeWebhook(earningsRepository as never);

        const response = await service.handle({
            headers: {
                'stripe-signature': 't=1,v1=signature',
            },
            request: {
                rawBody: '{"type":"checkout.session.completed"}',
                body: {
                    id: 'evt_123',
                    type: 'checkout.session.completed',
                    data: {
                        object: {
                            id: 'cs_test_123',
                            payment_intent: 'pi_123',
                            payment_status: 'paid',
                            metadata: {
                                paymentId: 'payment-1',
                            },
                        },
                    },
                },
            },
        } as never);

        expect(verifyStripeWebhookSignature).toHaveBeenCalled();
        expect(earningsRepository.updatePayment).toHaveBeenCalledWith(
            'payment-1',
            expect.objectContaining({
                status: 'processing',
                paymentReference: 'pi_123',
            }),
        );
        expect(notificationDispatcher.dispatch).toHaveBeenCalled();
        expect(response.data.handled).toBe(true);
    });
});
