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
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    PayoutMethodRepository: class PayoutMethodRepository {},
    EarningsRepository: class EarningsRepository {},
}));

import { ConflictError, ForbiddenError, RouteNotFoundError } from '@/core';
import { DeletePayoutMethod } from './index';

function buildDeps(
    overrides: {
        method?: unknown;
        listForUser?: unknown[];
        pendingPayouts?: unknown[];
    } = {},
) {
    const payoutMethodRepository = {
        getById: jest.fn().mockResolvedValue(
            'method' in overrides
                ? overrides.method
                : {
                      id: 'pm-1',
                      userId: 'user-1',
                      provider: 'bank',
                      isVerified: true,
                      isDefault: false,
                  },
        ),
        listForUser: jest.fn().mockResolvedValue(overrides.listForUser ?? []),
        deleteById: jest.fn().mockResolvedValue(undefined),
    };
    const earningsRepository = {
        getPayoutRequestsForTalent: jest.fn().mockResolvedValue(overrides.pendingPayouts ?? []),
    };
    return { payoutMethodRepository, earningsRepository };
}

describe('DeletePayoutMethod service', () => {
    it('deletes a non-default, unverified method freely', async () => {
        const { payoutMethodRepository, earningsRepository } = buildDeps({
            method: { id: 'pm-1', userId: 'user-1', provider: 'bank', isVerified: false, isDefault: false },
        });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        const response = await service.handle({
            params: { id: 'pm-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(payoutMethodRepository.deleteById).toHaveBeenCalledWith('pm-1');
        expect(earningsRepository.getPayoutRequestsForTalent).not.toHaveBeenCalled();
        expect(response.data).toEqual({ id: 'pm-1' });
    });

    it('allows deleting a verified method when the user has another verified one', async () => {
        const method = { id: 'pm-1', userId: 'user-1', provider: 'bank', isVerified: true, isDefault: false };
        const { payoutMethodRepository, earningsRepository } = buildDeps({
            method,
            listForUser: [method, { id: 'pm-2', userId: 'user-1', provider: 'paypal', isVerified: true, isDefault: true }],
        });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        await service.handle({
            params: { id: 'pm-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(earningsRepository.getPayoutRequestsForTalent).not.toHaveBeenCalled();
        expect(payoutMethodRepository.deleteById).toHaveBeenCalledWith('pm-1');
    });

    it('blocks deleting the only verified method when pending payouts exist', async () => {
        const method = { id: 'pm-1', userId: 'user-1', provider: 'bank', isVerified: true, isDefault: true };
        const { payoutMethodRepository, earningsRepository } = buildDeps({
            method,
            listForUser: [method],
            pendingPayouts: [{ id: 'payout-1', status: 'requested' }],
        });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        await expect(
            service.handle({
                params: { id: 'pm-1' },
                request: { user: { id: 'user-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);

        expect(payoutMethodRepository.deleteById).not.toHaveBeenCalled();
    });

    it('allows deleting the only verified method when no pending payouts exist', async () => {
        const method = { id: 'pm-1', userId: 'user-1', provider: 'bank', isVerified: true, isDefault: true };
        const { payoutMethodRepository, earningsRepository } = buildDeps({
            method,
            listForUser: [method],
            pendingPayouts: [{ id: 'payout-1', status: 'paid' }],
        });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        await service.handle({
            params: { id: 'pm-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(payoutMethodRepository.deleteById).toHaveBeenCalledWith('pm-1');
    });

    it('forbids deleting a payout method that belongs to another user', async () => {
        const { payoutMethodRepository, earningsRepository } = buildDeps({
            method: { id: 'pm-1', userId: 'someone-else', provider: 'bank', isVerified: false },
        });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        await expect(
            service.handle({
                params: { id: 'pm-1' },
                request: { user: { id: 'user-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('404s when the method does not exist', async () => {
        const { payoutMethodRepository, earningsRepository } = buildDeps({ method: null });
        const service = new DeletePayoutMethod(payoutMethodRepository as never, earningsRepository as never);

        await expect(
            service.handle({
                params: { id: 'pm-1' },
                request: { user: { id: 'user-1' } },
            } as never),
        ).rejects.toBeInstanceOf(RouteNotFoundError);
    });
});
