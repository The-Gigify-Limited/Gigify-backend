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

type MailSender = (request: { to: string; subject: string; body: string }) => Promise<unknown>;
type RecoveryLinkGenerator = (email: string) => Promise<{ actionLink: string }>;

export class ForgotPassword extends BaseService {
    constructor(
        private readonly userRepository: Pick<UserRepository, 'findByEmail'> = new UserRepository(),
        private readonly emailSender: MailSender = sendEmail,
        private readonly recoveryLinkGenerator?: RecoveryLinkGenerator,
    ) {
        super();
    }

    handle = async ({ input }: ControllerArgs<ForgotPasswordPayload>) => {
        if (!input?.email) {
            throw new BadRequestError('Email is required');
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);

        if (!user?.email) {
            logger.info('Password reset requested for an unknown email', { email: normalizedEmail });

            return this.buildSuccessResponse();
        }

        try {
            const { actionLink } = await this.createRecoveryLink(normalizedEmail);

            await this.emailSender({
                to: normalizedEmail,
                subject: 'Reset Your Gigify Password',
                body: passwordResetMail({
                    firstName: resolveUserDisplayName(user.firstName, normalizedEmail),
                    resetUrl: actionLink,
                }),
            });

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

    private async createRecoveryLink(email: string) {
        if (this.recoveryLinkGenerator) {
            return this.recoveryLinkGenerator(email);
        }

        return generatePasswordRecoveryLink({
            supabase: this.supabase,
            email,
        });
    }

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
