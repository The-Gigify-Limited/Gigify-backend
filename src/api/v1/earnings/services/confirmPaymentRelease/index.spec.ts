jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class TooManyRequestsError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        TooManyRequestsError,
        UnAuthorizedError,
        auditService: {
            log: jest.fn(),
        },
    };
});

jest.mock('../../utils/paymentReleaseOtp', () => ({
    PAYMENT_RELEASE_OTP_MAX_ATTEMPTS: 5,
    hashPaymentReleaseOtpCode: jest.fn((code: string) => `hash:${code}`),
}));

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
    DisputeRepository: class DisputeRepository {},
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

jest.mock('~/user/repository', () => ({
    ActivityRepository: class ActivityRepository {},
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { ConfirmPaymentRelease } from './index';

describe('ConfirmPaymentRelease service', () => {
    it('releases the payment and completes the gig when all payments are settled', async () => {
        const earningsRepository = {
            getPaymentById: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                amount: 200000,
                currency: 'NGN',
                status: 'pending',
            }),
            getActivePaymentReleaseOtp: jest.fn().mockResolvedValue({
                id: 'otp-1',
                paymentId: 'payment-1',
                employerId: 'employer-1',
                codeHash: 'hash:123456',
                attempts: 0,
                consumedAt: null,
                expiresAt: '2999-01-01T00:00:00.000Z',
            }),
            updatePayment: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                amount: 200000,
                currency: 'NGN',
                status: 'paid',
            }),
            updatePaymentReleaseOtp: jest.fn().mockResolvedValue(undefined),
            getPaymentsForGig: jest.fn().mockResolvedValue([
                {
                    id: 'payment-1',
                    status: 'paid',
                },
            ]),
        };
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                requiredTalentCount: 1,
                status: 'in_progress',
            }),
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'completed',
            }),
        };
        const employerRepository = {
            syncStats: jest.fn().mockResolvedValue(undefined),
        };
        const activityRepository = {
            logActivity: jest.fn().mockResolvedValue(undefined),
        };

        const disputeRepository = {
            findOpenDisputeForPayment: jest.fn().mockResolvedValue(null),
        };

        const service = new ConfirmPaymentRelease(
            earningsRepository as never,
            gigRepository as never,
            employerRepository as never,
            activityRepository as never,
            disputeRepository as never,
        );

        const response = await service.handle({
            params: { id: 'payment-1' },
            input: {
                otpCode: '123456',
            },
            request: {
                user: { id: 'employer-1' },
                headers: {},
                ip: '127.0.0.1',
            },
        } as never);

        expect(earningsRepository.updatePayment).toHaveBeenCalledWith(
            'payment-1',
            expect.objectContaining({
                status: 'paid',
            }),
        );
        expect(gigRepository.updateGigById).toHaveBeenCalledWith(
            'gig-1',
            expect.objectContaining({
                status: 'completed',
            }),
        );
        expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'talent-1',
                type: 'payment_update',
            }),
        );
        expect(response.message).toBe('Payment Released Successfully');
    });

    it('409s when an open dispute exists on the payment', async () => {
        const earningsRepository = {
            getPaymentById: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                status: 'processing',
            }),
            getActivePaymentReleaseOtp: jest.fn(),
            updatePayment: jest.fn(),
        };
        const gigRepository = { getGigById: jest.fn() };
        const employerRepository = { syncStats: jest.fn() };
        const activityRepository = { logActivity: jest.fn() };
        const disputeRepository = {
            findOpenDisputeForPayment: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'open' }),
        };

        const service = new ConfirmPaymentRelease(
            earningsRepository as never,
            gigRepository as never,
            employerRepository as never,
            activityRepository as never,
            disputeRepository as never,
        );

        await expect(
            service.handle({
                params: { id: 'payment-1' },
                input: { otpCode: '123456' },
                request: { user: { id: 'employer-1' }, headers: {}, ip: '1' },
            } as never),
        ).rejects.toThrow('Cannot release payment while a dispute is open');

        expect(earningsRepository.updatePayment).not.toHaveBeenCalled();
    });
});
