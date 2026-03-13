import { BadRequestError, BaseService, ControllerArgs, HttpStatus, ServerError, logger } from '@/core';
import { UserRepository } from '~/user/repository';
import { VerifyPhoneOtpPayload } from '../../interface';
import { mapSupabasePhoneAuthError, normalizePhoneNumber } from '../../utils';

export class VerifyPhoneOtp extends BaseService {
    constructor(private readonly userRepository: Pick<UserRepository, 'upsertAuthUserIdentity'> = new UserRepository()) {
        super();
    }

    handle = async ({ input }: ControllerArgs<VerifyPhoneOtpPayload>) => {
        if (!input?.phoneNumber || !input?.otp) throw new BadRequestError('Phone number and OTP are required');

        const phoneNumber = normalizePhoneNumber(input.phoneNumber);

        const { data, error } = await this.supabase.auth.verifyOtp({
            phone: phoneNumber,
            token: input.otp,
            type: 'sms',
        });

        if (error) {
            logger.error('Phone OTP verification failed', {
                phoneNumber,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabasePhoneAuthError(error, 'Invalid verification code');
        }

        if (!data.user?.id) {
            throw new ServerError('Supabase did not return a valid user after phone verification.');
        }

        const profile = await this.userRepository.upsertAuthUserIdentity({
            id: data.user.id,
            email: data.user.email ?? null,
            phoneNumber: data.user.phone ?? phoneNumber,
        });

        logger.info('Phone verified successfully', {
            userId: data.user.id,
            phoneNumber,
        });

        return {
            code: HttpStatus.OK,
            message: 'Phone number verified successfully',
            data: {
                user: data.user,
                session: data.session,
                profile,
            },
        };
    };
}

const verifyPhoneOtp = new VerifyPhoneOtp();
export default verifyPhoneOtp;
