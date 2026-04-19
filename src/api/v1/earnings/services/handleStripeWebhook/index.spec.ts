const mockDispatch = jest.fn();

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
            warn: jest.fn(),
        },
    };
});

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

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

    it('mirrors a Stripe charge.dispute.created into the internal disputes table', async () => {
        mockDispatch.mockReset().mockResolvedValue([]);

        const earningsRepository = {
            findPaymentByStripeIntent: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                status: 'processing',
                metadata: {},
            }),
        };
        const disputeRepository = {
            findLatestDisputeForPayment: jest.fn().mockResolvedValue(null),
            createDispute: jest.fn().mockResolvedValue({
                id: 'dispute-1',
                paymentId: 'payment-1',
                gigId: 'gig-1',
                status: 'open',
            }),
        };
        const gigRepository = {
            updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'disputed' }),
        };

        const service = new HandleStripeWebhook(earningsRepository as never, disputeRepository as never, gigRepository as never);

        const response = await service.handle({
            headers: { 'stripe-signature': 't=1,v1=signature' },
            request: {
                rawBody: '{"type":"charge.dispute.created"}',
                body: {
                    id: 'evt_321',
                    type: 'charge.dispute.created',
                    data: {
                        object: {
                            id: 'du_abc',
                            payment_intent: 'pi_123',
                            reason: 'fraudulent',
                            status: 'needs_response',
                        },
                    },
                },
            },
        } as never);

        expect(earningsRepository.findPaymentByStripeIntent).toHaveBeenCalledWith('pi_123');
        expect(disputeRepository.createDispute).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentId: 'payment-1',
                gigId: 'gig-1',
                raisedBy: null,
                reason: 'fraudulent',
                status: 'open',
            }),
        );
        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', { status: 'disputed' });
        expect(mockDispatch).toHaveBeenCalledWith('earnings:dispute-opened', expect.objectContaining({ disputeId: 'dispute-1' }));
        expect(response.data.handled).toBe(true);
    });

    it('is idempotent when a dispute already exists for the payment', async () => {
        mockDispatch.mockReset().mockResolvedValue([]);

        const earningsRepository = {
            findPaymentByStripeIntent: jest.fn().mockResolvedValue({
                id: 'payment-1',
                gigId: 'gig-1',
                status: 'processing',
            }),
        };
        const disputeRepository = {
            findLatestDisputeForPayment: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'open' }),
            createDispute: jest.fn(),
        };
        const gigRepository = { updateGigById: jest.fn() };

        const service = new HandleStripeWebhook(earningsRepository as never, disputeRepository as never, gigRepository as never);

        const response = await service.handle({
            headers: { 'stripe-signature': 't=1,v1=signature' },
            request: {
                rawBody: '{}',
                body: {
                    type: 'charge.dispute.created',
                    data: { object: { id: 'du_abc', payment_intent: 'pi_123' } },
                },
            },
        } as never);

        expect(disputeRepository.createDispute).not.toHaveBeenCalled();
        expect(gigRepository.updateGigById).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(response.data).toMatchObject({ handled: true, note: 'dispute already exists' });
    });

    it('closes a dispute as resolved_talent when Stripe reports won', async () => {
        mockDispatch.mockReset().mockResolvedValue([]);

        const earningsRepository = {
            findPaymentByStripeIntent: jest.fn().mockResolvedValue({
                id: 'payment-1',
                gigId: 'gig-1',
                status: 'processing',
            }),
        };
        const disputeRepository = {
            findLatestDisputeForPayment: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'open', adminNotes: null }),
            updateDispute: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'resolved_talent' }),
        };
        const gigRepository = { updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'completed' }) };

        const service = new HandleStripeWebhook(earningsRepository as never, disputeRepository as never, gigRepository as never);

        const response = await service.handle({
            headers: { 'stripe-signature': 't=1,v1=signature' },
            request: {
                rawBody: '{}',
                body: {
                    type: 'charge.dispute.closed',
                    data: { object: { id: 'du_abc', payment_intent: 'pi_123', status: 'won' } },
                },
            },
        } as never);

        expect(disputeRepository.updateDispute).toHaveBeenCalledWith('dispute-1', expect.objectContaining({ status: 'resolved_talent' }));
        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', { status: 'completed' });
        expect(mockDispatch).toHaveBeenCalledWith('earnings:dispute-resolved', expect.objectContaining({ resolution: 'resolved_talent' }));
        expect((response.data as unknown as { resolution: string }).resolution).toBe('resolved_talent');
    });

    it('closes a dispute as resolved_employer when Stripe reports lost', async () => {
        mockDispatch.mockReset().mockResolvedValue([]);

        const earningsRepository = {
            findPaymentByStripeIntent: jest.fn().mockResolvedValue({
                id: 'payment-1',
                gigId: 'gig-1',
                status: 'processing',
            }),
        };
        const disputeRepository = {
            findLatestDisputeForPayment: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'in_review', adminNotes: '' }),
            updateDispute: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'resolved_employer' }),
        };
        const gigRepository = { updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'cancelled' }) };

        const service = new HandleStripeWebhook(earningsRepository as never, disputeRepository as never, gigRepository as never);

        const response = await service.handle({
            headers: { 'stripe-signature': 't=1,v1=signature' },
            request: {
                rawBody: '{}',
                body: {
                    type: 'charge.dispute.closed',
                    data: { object: { id: 'du_abc', payment_intent: 'pi_123', status: 'lost' } },
                },
            },
        } as never);

        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', { status: 'cancelled' });
        expect((response.data as unknown as { resolution: string }).resolution).toBe('resolved_employer');
    });

    it('acks dispute webhooks with no matching payment without erroring', async () => {
        mockDispatch.mockReset().mockResolvedValue([]);

        const earningsRepository = {
            findPaymentByStripeIntent: jest.fn().mockResolvedValue(null),
        };
        const disputeRepository = { findLatestDisputeForPayment: jest.fn(), createDispute: jest.fn(), updateDispute: jest.fn() };
        const gigRepository = { updateGigById: jest.fn() };

        const service = new HandleStripeWebhook(earningsRepository as never, disputeRepository as never, gigRepository as never);

        const response = await service.handle({
            headers: { 'stripe-signature': 't=1,v1=signature' },
            request: {
                rawBody: '{}',
                body: {
                    type: 'charge.dispute.created',
                    data: { object: { id: 'du_abc', payment_intent: 'pi_unknown' } },
                },
            },
        } as never);

        expect(disputeRepository.createDispute).not.toHaveBeenCalled();
        expect(response.data.handled).toBe(false);
    });
});
