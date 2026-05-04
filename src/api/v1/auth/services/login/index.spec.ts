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
    newLoginActivityMail: ({ device, location, time }: { device: string; location: string; time: string }) =>
        `Device: ${device}\nLocation: ${location}\nTime: ${time}`,
    sendEmail: jest.fn(),
}));

import { Login } from './index';

describe('Login service', () => {
    it('normalizes the email and sends the new login activity notification', async () => {
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

        const service = new Login(userRepository as never, emailSender, recoveryLinkGenerator);
        const signInWithPassword = jest.fn().mockResolvedValue({
            data: {
                user: { id: 'auth-user-1' },
                session: {
                    access_token: 'access-token',
                    refresh_token: 'refresh-token',
                },
            },
            error: null,
        });

        (service as any).supabase = {
            auth: {
                signInWithPassword,
            },
        };

        const response = await service.handle({
            input: {
                email: 'Ada@Example.com',
                password: 'Password123!',
            },
            request: {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
                    'x-forwarded-for': '203.0.113.20',
                },
                ip: '203.0.113.20',
            },
        } as never);

        expect(signInWithPassword).toHaveBeenCalledWith({
            email: 'ada@example.com',
            password: 'Password123!',
        });
        expect(recoveryLinkGenerator).toHaveBeenCalledWith('ada@example.com');
        expect(emailSender).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'ada@example.com',
                subject: 'New Login Attempt on Your Gigify Account',
                body: expect.stringContaining('Device: Chrome on macOS'),
            }),
        );
        expect(response.message).toBe('Login successful');
        expect(response.data.accessToken).toBe('access-token');
        // remember flag was not supplied → sessionHint.persistent is false
        expect(response.data.sessionHint).toEqual({ persistent: false });
    });

    it('echoes sessionHint.persistent=true when the user checks "remember me"', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({ id: 'user-1', email: 'ada@example.com', firstName: 'Ada' }),
        };
        const emailSender = jest.fn().mockResolvedValue(undefined);
        const recoveryLinkGenerator = jest.fn().mockResolvedValue({ actionLink: 'https://example.com/reset' });

        const service = new Login(userRepository as never, emailSender, recoveryLinkGenerator);
        (service as any).supabase = {
            auth: {
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: { user: { id: 'u-1' }, session: { access_token: 'a', refresh_token: 'r' } },
                    error: null,
                }),
            },
        };

        const response = await service.handle({
            input: { email: 'ada@example.com', password: 'Password123!', remember: true },
            request: { headers: {}, ip: '203.0.113.20' },
        } as never);

        expect(response.data.sessionHint).toEqual({ persistent: true });
    });

    it('keeps login successful even if the security email cannot be sent', async () => {
        const userRepository = {
            findByEmail: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
            }),
        };
        const emailSender = jest.fn().mockRejectedValue(new Error('send failed'));
        const recoveryLinkGenerator = jest.fn().mockResolvedValue({
            actionLink: 'https://example.com/reset?token=abc123',
        });

        const service = new Login(userRepository as never, emailSender, recoveryLinkGenerator);

        (service as any).supabase = {
            auth: {
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: {
                        user: { id: 'auth-user-1' },
                        session: {
                            access_token: 'access-token',
                            refresh_token: 'refresh-token',
                        },
                    },
                    error: null,
                }),
            },
        };

        const response = await service.handle({
            input: {
                email: 'ada@example.com',
                password: 'Password123!',
            },
            request: {
                headers: {},
                ip: '203.0.113.20',
            },
        } as never);

        expect(response.message).toBe('Login successful');
        expect(emailSender).toHaveBeenCalled();
    });
});
