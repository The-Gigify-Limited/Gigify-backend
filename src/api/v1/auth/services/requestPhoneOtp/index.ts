import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { RequestPhoneOtpPayload } from '../../interface';
import { mapSupabasePhoneAuthError, normalizePhoneNumber } from '../../utils';

export class RequestPhoneOtp extends BaseService {
    handle = async ({ input }: ControllerArgs<RequestPhoneOtpPayload>) => {
        if (!input?.phoneNumber) throw new BadRequestError('Phone number is required');

        const phoneNumber = normalizePhoneNumber(input.phoneNumber);

        const { data, error } = await this.supabase.auth.signInWithOtp({
            phone: phoneNumber,
            options: {
                shouldCreateUser: true,
            },
        });

        if (error) {
            logger.error('Supabase phone OTP request failed', {
                phoneNumber,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabasePhoneAuthError(error, 'Unable to send a verification code right now.');
        }

        logger.info('Phone OTP requested successfully', {
            phoneNumber,
            userId: (data as any)?.user?.id ?? null,
        });

        return {
            code: HttpStatus.OK,
            message: 'Verification code sent successfully',
            data: {
                phoneNumber,
                channel: 'sms',
                resendAvailableInSeconds: 90,
            },
        };
    };
}

const requestPhoneOtp = new RequestPhoneOtp();
export default requestPhoneOtp;
