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
        config: {
            auth: {
                googleOAuthRedirectUrl: null,
            },
        },
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

jest.mock('../../utils', () => ({
    mapSupabaseAuthError: jest.fn(),
}));

import { GetGoogleAuthUrl } from './index';

describe('GetGoogleAuthUrl service', () => {
    it('returns the Google OAuth URL from Supabase', async () => {
        const service = new GetGoogleAuthUrl();
        const signInWithOAuth = jest.fn().mockResolvedValue({
            data: {
                url: 'https://example.supabase.co/auth/v1/authorize?provider=google',
            },
            error: null,
        });

        (service as any).supabase = {
            auth: {
                signInWithOAuth,
            },
        };

        const response = await service.handle({
            input: {
                redirectTo: 'https://app.gigify.com/auth/callback/google',
            },
        } as never);

        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: 'https://app.gigify.com/auth/callback/google',
            },
        });
        expect(response.message).toBe('Google authentication URL generated successfully');
        expect(response.data.url).toContain('provider=google');
    });
});
