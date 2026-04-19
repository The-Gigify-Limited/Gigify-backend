jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ForbiddenError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    PayoutMethodRepository: class PayoutMethodRepository {},
}));

import { ForbiddenError, RouteNotFoundError } from '@/core';
import { SetDefaultPayoutMethod } from './index';

describe('SetDefaultPayoutMethod service', () => {
    it('clears other defaults for the user and promotes the new one', async () => {
        const payoutMethodRepository = {
            getById: jest.fn().mockResolvedValue({ id: 'pm-1', userId: 'user-1', isDefault: false }),
            clearDefaultsForUser: jest.fn().mockResolvedValue(undefined),
            markDefault: jest.fn().mockResolvedValue({ id: 'pm-1', userId: 'user-1', isDefault: true }),
        };
        const service = new SetDefaultPayoutMethod(payoutMethodRepository as never);

        const response = await service.handle({
            params: { id: 'pm-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(payoutMethodRepository.clearDefaultsForUser).toHaveBeenCalledWith('user-1', 'pm-1');
        expect(payoutMethodRepository.markDefault).toHaveBeenCalledWith('pm-1');
        expect(response.data.isDefault).toBe(true);
    });

    it('forbids promoting a method owned by another user', async () => {
        const payoutMethodRepository = {
            getById: jest.fn().mockResolvedValue({ id: 'pm-1', userId: 'someone-else' }),
            clearDefaultsForUser: jest.fn(),
            markDefault: jest.fn(),
        };
        const service = new SetDefaultPayoutMethod(payoutMethodRepository as never);

        await expect(
            service.handle({
                params: { id: 'pm-1' },
                request: { user: { id: 'user-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ForbiddenError);

        expect(payoutMethodRepository.markDefault).not.toHaveBeenCalled();
    });

    it('404s when the method does not exist', async () => {
        const payoutMethodRepository = {
            getById: jest.fn().mockResolvedValue(null),
            clearDefaultsForUser: jest.fn(),
            markDefault: jest.fn(),
        };
        const service = new SetDefaultPayoutMethod(payoutMethodRepository as never);

        await expect(
            service.handle({
                params: { id: 'pm-1' },
                request: { user: { id: 'user-1' } },
            } as never),
        ).rejects.toBeInstanceOf(RouteNotFoundError);
    });
});
