const mockResetPasswordForEmail = jest.fn();

jest.mock('@/core', () => {
    class BaseService {
        supabase = {
            auth: {
                resetPasswordForEmail: mockResetPasswordForEmail,
            },
        };
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
    passwordResetMail: jest.fn(),
    sendEmail: jest.fn(),
}));

import { TooManyRequestsError } from '@/core';
import { ForgotPassword } from './index';

describe('ForgotPassword service', () => {
    beforeEach(() => {
        mockResetPasswordForEmail.mockReset();
    });

    it('returns a generic success response for unknown emails', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue(null),
        };

        const service = new ForgotPassword(userRepository as never);

        const response = await service.handle({
            input: { email: 'missing@example.com' },
            request: { headers: { origin: 'http://localhost:3000' } },
        } as never);

        expect(userRepository.findByEmail).toHaveBeenCalledWith('missing@example.com');
        expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
        expect(response.message).toContain('If an account with that email exists');
    });

    it('sends a password reset email for known users', async () => {
        mockResetPasswordForEmail.mockResolvedValue({ error: null });

        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
            }),
        };

        const service = new ForgotPassword(userRepository as never);

        const response = await service.handle({
            input: { email: 'Ada@Example.com' },
            request: { headers: { origin: 'http://localhost:3000' } },
        } as never);

        expect(userRepository.findByEmail).toHaveBeenCalledWith('ada@example.com');
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('ada@example.com', {
            redirectTo: 'http://localhost:3000/auth/callback/client?type=recovery&next=/reset-password',
        });
        expect(response.code).toBe(200);
    });

    it('surfaces password reset rate limits from Supabase', async () => {
        mockResetPasswordForEmail.mockResolvedValue({
            error: { status: 429, code: 'over_email_send_rate_limit', message: 'Rate limit exceeded' },
        });

        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
            }),
        };

        const service = new ForgotPassword(userRepository as never);

        await expect(
            service.handle({
                input: { email: 'ada@example.com' },
                request: { headers: { origin: 'http://localhost:3000' } },
            } as never),
        ).rejects.toBeInstanceOf(TooManyRequestsError);
    });
});
