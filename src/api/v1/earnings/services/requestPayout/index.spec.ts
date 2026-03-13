jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { CREATED: 201 },
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

jest.mock('~/user/repository', () => ({
    ActivityRepository: class ActivityRepository {},
}));

import { ConflictError } from '@/core';
import { RequestPayout } from './index';

describe('RequestPayout service', () => {
    it('rejects payout requests that exceed the available balance', async () => {
        const earningsRepository = {
            getEarningsSummary: jest.fn().mockResolvedValue({
                availableForPayout: 25000,
            }),
        };
        const activityRepository = {
            logActivity: jest.fn(),
        };

        const service = new RequestPayout(earningsRepository as never, activityRepository as never);

        await expect(
            service.handle({
                input: {
                    amount: 30000,
                },
                request: { user: { id: 'talent-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it('creates a payout request and logs payout_requested when the balance is sufficient', async () => {
        const earningsRepository = {
            getEarningsSummary: jest.fn().mockResolvedValue({
                availableForPayout: 50000,
            }),
            createPayoutRequest: jest.fn().mockResolvedValue({
                id: 'payout-1',
                amount: 15000,
            }),
        };
        const activityRepository = {
            logActivity: jest.fn().mockResolvedValue(undefined),
        };

        const service = new RequestPayout(earningsRepository as never, activityRepository as never);

        const response = await service.handle({
            input: {
                amount: 15000,
                note: 'Weekly withdrawal',
            },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(earningsRepository.createPayoutRequest).toHaveBeenCalledWith('talent-1', {
            amount: 15000,
            note: 'Weekly withdrawal',
        });
        expect(activityRepository.logActivity).toHaveBeenCalledWith('talent-1', 'payout_requested', 'payout-1', {
            amount: 15000,
        });
        expect(response.code).toBe(201);
    });
});
