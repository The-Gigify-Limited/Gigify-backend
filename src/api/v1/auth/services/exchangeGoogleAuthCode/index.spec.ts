jest.mock('@/core', () => {
    class BaseService {
        supabase = {};
    }

    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class TooManyRequestsError extends Error {}
    class UnAuthorizedError extends Error {}
    class ServerError extends Error {}

    return {
        BadRequestError,
        BaseService,
        ConflictError,
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

jest.mock('../../utils', () => ({
    mapSupabaseAuthError: jest.fn(),
}));

import { ExchangeGoogleAuthCode } from './index';

describe('ExchangeGoogleAuthCode service', () => {
    it('exchanges the OAuth code and upserts the authenticated profile', async () => {
        const userRepository = {
            upsertAuthUserIdentity: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
            }),
        };

        const service = new ExchangeGoogleAuthCode(userRepository as never);

        (service as any).supabase = {
            auth: {
                exchangeCodeForSession: jest.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'user-1',
                            email: 'ada@example.com',
                            phone: null,
                        },
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
                code: 'google-oauth-code',
            },
        } as never);

        expect(userRepository.upsertAuthUserIdentity).toHaveBeenCalledWith({
            id: 'user-1',
            email: 'ada@example.com',
            phoneNumber: null,
        });
        expect(response.message).toBe('Google authentication completed successfully');
        expect(response.data.profile.id).toBe('user-1');
    });
});
