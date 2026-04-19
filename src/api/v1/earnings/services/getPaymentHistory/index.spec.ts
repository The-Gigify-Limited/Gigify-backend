jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
    DisputeRepository: class DisputeRepository {},
}));

import { GetPaymentHistory } from './index';

function buildDeps(overrides: { disputedPaymentIds?: string[] } = {}) {
    const earningsRepository = {
        getPaymentHistoryForUser: jest.fn().mockResolvedValue([]),
    };
    const disputeRepository = {
        findPaymentIdsWithOpenDispute: jest.fn().mockResolvedValue(overrides.disputedPaymentIds ?? []),
    };
    return { earningsRepository, disputeRepository };
}

describe('GetPaymentHistory service', () => {
    it('retrieves payment history for the authenticated user', async () => {
        const { earningsRepository, disputeRepository } = buildDeps();
        earningsRepository.getPaymentHistoryForUser.mockResolvedValue([
            { id: 'payment-1', amount: 1000, status: 'paid' },
            { id: 'payment-2', amount: 1500, status: 'pending' },
        ]);

        const service = new GetPaymentHistory(earningsRepository as never, disputeRepository as never);

        const response = await service.handle({
            query: { page: 1, pageSize: 10 },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(earningsRepository.getPaymentHistoryForUser).toHaveBeenCalledWith('talent-1', expect.objectContaining({ page: 1, pageSize: 10 }));
        expect(response.data).toHaveLength(2);
    });

    it('translates the frontend status "released" to payment status "paid"', async () => {
        const { earningsRepository, disputeRepository } = buildDeps();
        const service = new GetPaymentHistory(earningsRepository as never, disputeRepository as never);

        await service.handle({
            query: { status: 'released' },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(earningsRepository.getPaymentHistoryForUser).toHaveBeenCalledWith('talent-1', expect.objectContaining({ status: 'paid' }));
    });

    it('resolves status "disputed" by scoping to payments with an open dispute row', async () => {
        const { earningsRepository, disputeRepository } = buildDeps({ disputedPaymentIds: ['payment-9', 'payment-42'] });
        const service = new GetPaymentHistory(earningsRepository as never, disputeRepository as never);

        await service.handle({
            query: { status: 'disputed' },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(disputeRepository.findPaymentIdsWithOpenDispute).toHaveBeenCalled();
        expect(earningsRepository.getPaymentHistoryForUser).toHaveBeenCalledWith(
            'talent-1',
            expect.objectContaining({ paymentIdsFilter: ['payment-9', 'payment-42'], status: undefined }),
        );
    });

    it('forwards dateFrom, dateTo, direction, and gigId through to the repo', async () => {
        const { earningsRepository, disputeRepository } = buildDeps();
        const service = new GetPaymentHistory(earningsRepository as never, disputeRepository as never);

        await service.handle({
            query: {
                dateFrom: '2026-01-01',
                dateTo: '2026-02-01',
                direction: 'outgoing',
                gigId: 'gig-1',
            },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(earningsRepository.getPaymentHistoryForUser).toHaveBeenCalledWith(
            'employer-1',
            expect.objectContaining({
                dateFrom: '2026-01-01',
                dateTo: '2026-02-01',
                direction: 'outgoing',
                gigId: 'gig-1',
            }),
        );
    });

    it('throws when the user is not authenticated', async () => {
        const { earningsRepository, disputeRepository } = buildDeps();
        const service = new GetPaymentHistory(earningsRepository as never, disputeRepository as never);

        await expect(
            service.handle({
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(earningsRepository.getPaymentHistoryForUser).not.toHaveBeenCalled();
    });
});
