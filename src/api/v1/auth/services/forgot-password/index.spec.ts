jest.mock('@/core', () => {
    class BaseService {
        supabase = {};
    }

    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class ForbiddenError extends Error {}
    class TooManyRequestsError extends Error {}
    class UnAuthorizedError extends Error {}
    class ServerError extends Error {}

    return {
        BaseService,
        BadRequestError,
        ConflictError,
        ForbiddenError,
        HttpStatus: { OK: 200 },
        ServerError,
        TooManyRequestsError,
        UnAuthorizedError,
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('@/core/services/mails', () => ({
    passwordResetMail: ({ firstName, resetUrl }: { firstName: string; resetUrl: string }) => `Hello ${firstName}, ${resetUrl}`,
    sendEmail: jest.fn(),
}));

import { TooManyRequestsError } from '@/core';
import { ForgotPassword } from './index';

describe('ForgotPassword service', () => {
    it('returns a generic success response for unknown emails', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue(null),
        };
        const emailSender = jest.fn();

        const service = new ForgotPassword(userRepository as never);

        const response = await service.handle({
            input: { email: 'missing@example.com' },
        } as never);

        expect(userRepository.findByEmail).toHaveBeenCalledWith('missing@example.com');
        expect(emailSender).not.toHaveBeenCalled();
        expect(response.message).toContain('If an account with that email exists');
    });

    it('generates a recovery link and sends the branded reset email for known users', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
            }),
        };
        const emailSender = jest.fn().mockResolvedValue(undefined);
        const recoveryLinkGenerator = jest.fn().mockResolvedValue({
            actionLink: 'https://example.com/reset?token=abc123',
        });

        const service = new ForgotPassword(userRepository as never);

        const response = await service.handle({
            input: { email: 'Ada@Example.com' },
        } as never);

        expect(userRepository.findByEmail).toHaveBeenCalledWith('ada@example.com');
        expect(recoveryLinkGenerator).toHaveBeenCalledWith('ada@example.com');
        expect(emailSender).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'ada@example.com',
                subject: 'Reset Your Gigify Password',
                body: expect.stringContaining('Hello Ada,'),
            }),
        );
        expect(response.code).toBe(200);
    });

    it('surfaces password reset rate limits from Supabase', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
            }),
        };
        const emailSender = jest.fn();
        const recoveryLinkGenerator = jest.fn().mockRejectedValue({
            status: 429,
            code: 'over_email_send_rate_limit',
        });

        const service = new ForgotPassword(userRepository as never);

        await expect(
            service.handle({
                input: { email: 'ada@example.com' },
            } as never),
        ).rejects.toBeInstanceOf(TooManyRequestsError);
    });
});
