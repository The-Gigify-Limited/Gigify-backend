jest.mock('@/core', () => {
    class BaseService {
        supabase = {};
    }

    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class TooManyRequestsError extends Error {}

    return {
        BaseService,
        BadRequestError,
        ForbiddenError,
        HttpStatus: { OK: 200 },
        TooManyRequestsError,
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('../../utils', () => ({
    mapSupabasePhoneAuthError: jest.fn(),
    normalizePhoneNumber: jest.fn((value: string) => value.replace(/\s+/g, '')),
}));

import { RequestPhoneOtp } from './index';

describe('RequestPhoneOtp service', () => {
    it('normalizes the phone number and requests an OTP from Supabase', async () => {
        const service = new RequestPhoneOtp();
        const signInWithOtp = jest.fn().mockResolvedValue({
            data: {
                user: {
                    id: 'auth-user-1',
                },
            },
            error: null,
        });

        (service as any).supabase = {
            auth: {
                signInWithOtp,
            },
        };

        const response = await service.handle({
            input: {
                phoneNumber: '+234 801 234 5678',
            },
        } as never);

        expect(signInWithOtp).toHaveBeenCalledWith({
            phone: '+2348012345678',
            options: {
                shouldCreateUser: true,
            },
        });
        expect(response.message).toBe('Verification code sent successfully');
        expect(response.data.phoneNumber).toBe('+2348012345678');
    });
});
