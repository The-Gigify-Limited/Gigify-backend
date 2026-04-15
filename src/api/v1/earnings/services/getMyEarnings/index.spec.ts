jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

import { GetMyEarnings } from './index';

describe('GetMyEarnings service', () => {
    it('retrieves earnings summary for authenticated talent', async () => {
        const earningsRepository = {
            getEarningsSummary: jest.fn().mockResolvedValue({
                totalEarned: 5000,
                pendingPayments: 1000,
                availableForPayout: 4000,
                totalRequestedPayouts: 0,
                currency: 'USD',
                payments: [],
                payoutRequests: [],
            }),
        };

        const service = new GetMyEarnings(earningsRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(earningsRepository.getEarningsSummary).toHaveBeenCalledWith('talent-1');
        expect(response.message).toBe('Earnings Retrieved Successfully');
        expect(response.data.totalEarned).toBe(5000);
        expect(response.data.pendingPayments).toBe(1000);
    });

    it('returns zero earnings when talent has no payments', async () => {
        const earningsRepository = {
            getEarningsSummary: jest.fn().mockResolvedValue({
                totalEarned: 0,
                pendingPayments: 0,
                availableForPayout: 0,
                totalRequestedPayouts: 0,
                currency: 'USD',
                payments: [],
                payoutRequests: [],
            }),
        };

        const service = new GetMyEarnings(earningsRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data.totalEarned).toBe(0);
    });

    it('throws when user is not authenticated', async () => {
        const earningsRepository = {
            getEarningsSummary: jest.fn(),
        };

        const service = new GetMyEarnings(earningsRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(earningsRepository.getEarningsSummary).not.toHaveBeenCalled();
    });
});
