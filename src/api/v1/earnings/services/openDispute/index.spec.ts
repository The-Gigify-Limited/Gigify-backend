const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        ForbiddenError,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

jest.mock('~/earnings/repository', () => ({
    DisputeRepository: class DisputeRepository {},
    EarningsRepository: class EarningsRepository {},
}));

import { ConflictError, ForbiddenError, RouteNotFoundError } from '@/core';
import { OpenDispute } from './index';

function buildDeps(overrides: { payment?: unknown; createdDispute?: unknown } = {}) {
    const payment =
        'payment' in overrides
            ? overrides.payment
            : {
                  id: 'payment-1',
                  employerId: 'employer-1',
                  talentId: 'talent-1',
                  gigId: 'gig-1',
                  status: 'processing',
              };
    const createdDispute =
        'createdDispute' in overrides
            ? overrides.createdDispute
            : {
                  id: 'dispute-1',
                  paymentId: 'payment-1',
                  gigId: 'gig-1',
                  raisedBy: 'talent-1',
                  reason: 'No-show',
                  status: 'open',
              };

    const disputeRepository = {
        createDispute: jest.fn().mockResolvedValue(createdDispute),
    };
    const earningsRepository = {
        getPaymentById: jest.fn().mockResolvedValue(payment),
    };
    const gigRepository = {
        updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'disputed' }),
    };

    return { disputeRepository, earningsRepository, gigRepository };
}

describe('OpenDispute service', () => {
    beforeEach(() => {
        mockDispatch.mockReset().mockResolvedValue([]);
    });

    it('creates a dispute, marks the gig disputed, and dispatches earnings:dispute-opened', async () => {
        const { disputeRepository, earningsRepository, gigRepository } = buildDeps();
        const service = new OpenDispute(disputeRepository as never, earningsRepository as never, gigRepository as never);

        const response = await service.handle({
            params: { id: 'payment-1' },
            input: { reason: 'No-show', description: 'Talent never showed' },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(disputeRepository.createDispute).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentId: 'payment-1',
                gigId: 'gig-1',
                raisedBy: 'talent-1',
                reason: 'No-show',
                status: 'open',
            }),
        );
        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', { status: 'disputed' });
        expect(mockDispatch).toHaveBeenCalledWith(
            'earnings:dispute-opened',
            expect.objectContaining({ disputeId: 'dispute-1', paymentId: 'payment-1' }),
        );
        expect(response.code).toBe(201);
    });

    it('404s when the payment does not exist', async () => {
        const { disputeRepository, earningsRepository, gigRepository } = buildDeps({ payment: null });
        const service = new OpenDispute(disputeRepository as never, earningsRepository as never, gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'payment-1' },
                input: { reason: 'x' },
                request: { user: { id: 'talent-1' } },
            } as never),
        ).rejects.toBeInstanceOf(RouteNotFoundError);
    });

    it('forbids users who are not party to the payment', async () => {
        const { disputeRepository, earningsRepository, gigRepository } = buildDeps();
        const service = new OpenDispute(disputeRepository as never, earningsRepository as never, gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'payment-1' },
                input: { reason: 'x' },
                request: { user: { id: 'outsider-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('409s when the payment is already in a terminal state like refunded', async () => {
        const { disputeRepository, earningsRepository, gigRepository } = buildDeps({
            payment: { id: 'payment-1', employerId: 'employer-1', talentId: 'talent-1', gigId: 'gig-1', status: 'refunded' },
        });
        const service = new OpenDispute(disputeRepository as never, earningsRepository as never, gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'payment-1' },
                input: { reason: 'x' },
                request: { user: { id: 'talent-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);
    });
});
