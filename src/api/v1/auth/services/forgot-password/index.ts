import { BadRequestError, BaseService, ControllerArgs, HttpStatus, ServerError, logger } from '@/core';
import { passwordResetMail, sendEmail } from '@/core/services/mails';
import { UserRepository } from '~/user/repository';
import { ForgotPasswordPayload } from '../../interface';
import {
    PASSWORD_RESET_REQUEST_MESSAGE,
    generatePasswordRecoveryLink,
    mapSupabaseRecoveryError,
    resolveUserDisplayName,
} from '../../utils/passwordRecovery';

export class ForgotPassword extends BaseService {
    constructor(private readonly userRepository: Pick<UserRepository, 'findByEmail'> = new UserRepository()) {
        super();
    }

    handle = async ({ input, request }: ControllerArgs<ForgotPasswordPayload>) => {
        if (!input?.email) {
            throw new BadRequestError('Email is required');
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);

        if (!user?.email) {
            logger.info('Password reset requested for an unknown email', { email: normalizedEmail });

            return this.buildSuccessResponse();
        }

        const headers = request.headers;
        const origin = headers.origin;

        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: `${origin}/auth/callback/client?type=recovery&next=/reset-password`,
            });

            if (error) throw error;

            logger.info('Password reset email sent successfully', {
                email: normalizedEmail,
                userId: user.id,
            });
        } catch (error: any) {
            logger.error('Failed to send password reset email', {
                email: normalizedEmail,
                error: error?.message,
                status: error?.status,
                code: error?.code,
            });

            if (error?.status || error?.code) {
                mapSupabaseRecoveryError(error);
            }

            throw new ServerError('Unable to send the password reset email right now. Please try again later.');
        }

        return this.buildSuccessResponse();
    };

    private buildSuccessResponse() {
        return {
            data: null,
            code: HttpStatus.OK,
            message: PASSWORD_RESET_REQUEST_MESSAGE,
        };
    }
}

const forgotPasswordInstance = new ForgotPassword();

export default forgotPasswordInstance;
