jest.mock('@/core', () => {
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class TooManyRequestsError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
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

jest.mock('@/core/services/mails', () => ({
    sendEmail: jest.fn(),
}));

jest.mock('@/core/services/mails/views', () => ({
    paymentReleaseOtpMail: ({ otpCode }: { otpCode: string }) => `OTP: ${otpCode}`,
}));

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('../../utils/paymentReleaseOtp', () => ({
    buildPaymentReleaseOtpExpiry: jest.fn(() => '2026-03-13T10:10:00.000Z'),
    generatePaymentReleaseOtpCode: jest.fn(() => '123456'),
    getPaymentReleaseOtpCooldownRemaining: jest.fn(() => 0),
    hashPaymentReleaseOtpCode: jest.fn((code: string) => `hash:${code}`),
}));

import { sendEmail } from '@/core/services/mails';
import { RequestPaymentReleaseOtp } from './index';

describe('RequestPaymentReleaseOtp service', () => {
    it('creates an OTP record and emails the employer verification code', async () => {
        const earningsRepository = {
            getPaymentById: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                currency: 'NGN',
                amount: 200000,
                status: 'pending',
            }),
            getActivePaymentReleaseOtp: jest.fn().mockResolvedValue(null),
            createPaymentReleaseOtp: jest.fn().mockResolvedValue({
                id: 'otp-1',
            }),
        };
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Wedding of Mike and Sarah #MS2025',
            }),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'employer-1',
                email: 'employer@gigify.com',
                first_name: 'Ada',
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'employer-1',
                email: 'employer@gigify.com',
                firstName: 'Ada',
            }),
        };

        const service = new RequestPaymentReleaseOtp(earningsRepository as never, gigRepository as never, userRepository as never);

        const response = await service.handle({
            params: { id: 'payment-1' },
            request: {
                user: { id: 'employer-1' },
                headers: {},
                ip: '127.0.0.1',
            },
        } as never);

        expect(earningsRepository.createPaymentReleaseOtp).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentId: 'payment-1',
                employerId: 'employer-1',
                codeHash: 'hash:123456',
            }),
        );
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'employer@gigify.com',
                subject: 'Gigify payment release verification code',
                body: expect.stringContaining('OTP: 123456'),
            }),
        );
        expect(response.message).toBe('Payment Release Verification Code Sent Successfully');
    });
});
