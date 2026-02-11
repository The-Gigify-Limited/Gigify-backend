import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { ResendVerifyEmailPayload, VerifyEmailPayload } from '../../interface';

export class VerifyEmail extends BaseService {
    verifyOtp = async ({ input }: ControllerArgs<VerifyEmailPayload>) => {
        if (!input?.email || !input?.otp) throw new BadRequestError('Email and OTP are required');

        const { email, otp } = input;
        const normalizedEmail = email.toLowerCase();

        const { data, error } = await this.supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });

        if (error) {
            logger.error('OTP verification failed', { email: normalizedEmail, otp, error });

            throw new BadRequestError(error.message ?? 'Invalid OTP');
        }

        const session = data.session!;
        const user = data.user!;

        logger.info('Email verified successfully', { email, userId: user.id });

        return {
            data: { user, session },
            code: HttpStatus.OK,
            message: 'Account verified! You’re now signed in.',
        };
    };

    resendEmail = async ({ input }: ControllerArgs<ResendVerifyEmailPayload>) => {
        if (!input?.email) throw new BadRequestError('Email is required');

        const { email } = input;
        const normalizedEmail = email.toLowerCase();

        const { error } = await this.supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
        });

        if (error) {
            logger.error('Failed to resend verification email', { email: normalizedEmail, error });

            throw new BadRequestError(error?.message ?? 'Failed to resend verification email');
        }

        logger.info('Verification email resent', { email: normalizedEmail });

        return {
            data: null,
            code: HttpStatus.OK,
            message: 'If you have an account with us, you will receive the verification code',
        };
    };
}

const verifyEmailOtpInstance = new VerifyEmail();
export default verifyEmailOtpInstance;
