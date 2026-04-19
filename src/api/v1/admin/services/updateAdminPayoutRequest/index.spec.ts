const mockAuditLog = jest.fn();

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
        auditService: {
            log: mockAuditLog,
        },
    };
});

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

import { BadRequestError } from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { UpdateAdminPayoutRequest } from './index';

function buildRepo(overrides: { payoutRequest?: unknown; updated?: unknown } = {}) {
    const payoutRequest =
        'payoutRequest' in overrides
            ? overrides.payoutRequest
            : { id: 'payout-1', talentId: 'talent-1', status: 'approved', amount: 90000, currency: 'NGN' };
    const updated = overrides.updated ?? {
        id: 'payout-1',
        talentId: 'talent-1',
        status: 'paid',
        externalTransferId: 'txn_abc',
        externalProvider: 'stripe',
        paidAt: '2026-04-19T12:00:00.000Z',
        paidBy: 'admin-1',
    };

    return {
        getPayoutRequestById: jest.fn().mockResolvedValue(payoutRequest),
        updatePayoutRequest: jest.fn().mockResolvedValue(updated),
    };
}

describe('UpdateAdminPayoutRequest service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('marks a payout paid and stamps external ref + paid_at + paid_by', async () => {
        const earningsRepository = buildRepo();
        const service = new UpdateAdminPayoutRequest(earningsRepository as never);

        const response = await service.handle({
            params: { id: 'payout-1' },
            input: {
                status: 'paid',
                externalTransferId: 'txn_abc',
                externalProvider: 'stripe',
            },
            request: { user: { id: 'admin-1' }, headers: {}, ip: '1' },
        } as never);

        expect(earningsRepository.updatePayoutRequest).toHaveBeenCalledWith(
            'payout-1',
            expect.objectContaining({
                status: 'paid',
                externalTransferId: 'txn_abc',
                externalProvider: 'stripe',
                paidBy: 'admin-1',
            }),
        );

        const updatesArg = earningsRepository.updatePayoutRequest.mock.calls[0][1] as { paidAt?: string };
        expect(typeof updatesArg.paidAt).toBe('string');

        expect(mockAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'admin-1',
                action: 'admin_payout_request_updated',
                changes: expect.objectContaining({ status: 'paid', externalTransferId: 'txn_abc', externalProvider: 'stripe' }),
            }),
        );
        expect(notificationDispatcher.dispatch).toHaveBeenCalled();
        expect(response.message).toBe('Payout Request Updated Successfully');
    });

    it('rejects marking paid without an externalTransferId', async () => {
        const earningsRepository = buildRepo();
        const service = new UpdateAdminPayoutRequest(earningsRepository as never);

        await expect(
            service.handle({
                params: { id: 'payout-1' },
                input: { status: 'paid', externalProvider: 'bank_wire' },
                request: { user: { id: 'admin-1' }, headers: {}, ip: '1' },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(earningsRepository.updatePayoutRequest).not.toHaveBeenCalled();
    });

    it('rejects marking paid without an externalProvider', async () => {
        const earningsRepository = buildRepo();
        const service = new UpdateAdminPayoutRequest(earningsRepository as never);

        await expect(
            service.handle({
                params: { id: 'payout-1' },
                input: { status: 'paid', externalTransferId: 'txn_abc' },
                request: { user: { id: 'admin-1' }, headers: {}, ip: '1' },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(earningsRepository.updatePayoutRequest).not.toHaveBeenCalled();
    });

    it('does not require external ref for non-paid transitions', async () => {
        const earningsRepository = buildRepo({
            updated: { id: 'payout-1', talentId: 'talent-1', status: 'rejected' },
        });
        const service = new UpdateAdminPayoutRequest(earningsRepository as never);

        await service.handle({
            params: { id: 'payout-1' },
            input: { status: 'rejected' },
            request: { user: { id: 'admin-1' }, headers: {}, ip: '1' },
        } as never);

        expect(earningsRepository.updatePayoutRequest).toHaveBeenCalledWith(
            'payout-1',
            expect.not.objectContaining({ externalTransferId: expect.anything(), paidBy: expect.anything() }),
        );
    });
});
