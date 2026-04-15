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

import { GetPaymentHistory } from './index';

describe('GetPaymentHistory service', () => {
    it('retrieves payment history for authenticated talent', async () => {
        const earningsRepository = {
            getPaymentHistoryForTalent: jest.fn().mockResolvedValue([
                {
                    id: 'payment-1',
                    amount: 1000,
                    status: 'completed',
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'payment-2',
                    amount: 1500,
                    status: 'completed',
                    createdAt: '2024-01-15T00:00:00Z',
                },
            ]),
        };

        const service = new GetPaymentHistory(earningsRepository as never);

        const response = await service.handle({
            query: { limit: 10 },
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(earningsRepository.getPaymentHistoryForTalent).toHaveBeenCalledWith('talent-1', { limit: 10 });
        expect(response.message).toBe('Payment History Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('returns empty list when no payment history exists', async () => {
        const earningsRepository = {
            getPaymentHistoryForTalent: jest.fn().mockResolvedValue([]),
        };

        const service = new GetPaymentHistory(earningsRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toEqual([]);
    });

    it('passes query parameters to repository', async () => {
        const earningsRepository = {
            getPaymentHistoryForTalent: jest.fn().mockResolvedValue([]),
        };

        const service = new GetPaymentHistory(earningsRepository as never);

        await service.handle({
            query: { limit: 20, offset: 10, status: 'completed' },
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(earningsRepository.getPaymentHistoryForTalent).toHaveBeenCalledWith('talent-1', {
            limit: 20,
            offset: 10,
            status: 'completed',
        });
    });

    it('throws when user is not authenticated', async () => {
        const earningsRepository = {
            getPaymentHistoryForTalent: jest.fn(),
        };

        const service = new GetPaymentHistory(earningsRepository as never);

        await expect(
            service.handle({
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(earningsRepository.getPaymentHistoryForTalent).not.toHaveBeenCalled();
    });
});
