jest.mock('@/core', () => {
    class BaseService {
        supabase = {};
    }

    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class ServerError extends Error {}
    class TooManyRequestsError extends Error {}

    return {
        BaseService,
        BadRequestError,
        ForbiddenError,
        HttpStatus: { OK: 200 },
        ServerError,
        TooManyRequestsError,
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
    mapSupabasePhoneAuthError: jest.fn(),
    normalizePhoneNumber: jest.fn((value: string) => value.replace(/\s+/g, '')),
}));

import { VerifyPhoneOtp } from './index';

describe('VerifyPhoneOtp service', () => {
    it('verifies the OTP and upserts the authenticated phone user', async () => {
        const userRepository = {
            upsertAuthUserIdentity: jest.fn().mockResolvedValue({
                id: 'auth-user-1',
                phoneNumber: '+2348012345678',
            }),
        };

        const service = new VerifyPhoneOtp(userRepository as never);
        const verifyOtp = jest.fn().mockResolvedValue({
            data: {
                user: {
                    id: 'auth-user-1',
                    email: null,
                    phone: '+2348012345678',
                },
                session: {
                    access_token: 'access-token',
                    refresh_token: 'refresh-token',
                },
            },
            error: null,
        });

        (service as any).supabase = {
            auth: {
                verifyOtp,
            },
        };

        const response = await service.handle({
            input: {
                phoneNumber: '+2348012345678',
                otp: '123456',
            },
        } as never);

        expect(verifyOtp).toHaveBeenCalledWith({
            phone: '+2348012345678',
            token: '123456',
            type: 'sms',
        });
        expect(userRepository.upsertAuthUserIdentity).toHaveBeenCalledWith({
            id: 'auth-user-1',
            email: null,
            phoneNumber: '+2348012345678',
        });
        expect(response.message).toBe('Phone number verified successfully');
        expect(response.data.profile.phoneNumber).toBe('+2348012345678');
    });
});
