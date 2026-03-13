import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { newLoginActivityMail, sendEmail } from '@/core/services/mails';
import { UserRepository } from '~/user/repository';
import { LoginPayload } from '../../interface';
import { buildLoginActivityContext } from '../../utils/loginActivity';
import { mapSupabaseAuthError } from '../../utils/mapSupabaseAuthError';
import { generatePasswordRecoveryLink, resolveUserDisplayName } from '../../utils/passwordRecovery';

type MailSender = (request: { to: string; subject: string; body: string }) => Promise<unknown>;
type RecoveryLinkGenerator = (email: string) => Promise<{ actionLink: string }>;

export class Login extends BaseService {
    constructor(
        private readonly userRepository: Pick<UserRepository, 'findByEmail'> = new UserRepository(),
        private readonly emailSender: MailSender = sendEmail,
        private readonly recoveryLinkGenerator?: RecoveryLinkGenerator,
    ) {
        super();
    }

    handle = async ({ input, request }: ControllerArgs<LoginPayload>) => {
        if (!input) throw new BadRequestError('Invalid credentials');

        const { email, password } = input;

        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });

        if (error) {
            logger.error('Supabase login failed', {
                email: normalizedEmail,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Login failed. Please try again later.');
        }

        logger.info('User Logged In Successfully', {
            userId: data.user?.id,
            email: normalizedEmail,
        });

        await this.sendLoginActivityNotification(normalizedEmail, request);

        return {
            data: {
                user: data.user,
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token,
            },
            code: HttpStatus.OK,
            message: 'Login successful',
        };
    };

    private async sendLoginActivityNotification(email: string, request?: LoginPayload['request']) {
        try {
            const user = await this.userRepository.findByEmail(email);

            if (!user?.email) {
                return;
            }

            const { actionLink } = await this.createRecoveryLink(email);
            const { device, location, time } = buildLoginActivityContext(request);

            await this.emailSender({
                to: user.email,
                subject: 'New Login Attempt on Your Gigify Account',
                body: newLoginActivityMail({
                    firstName: resolveUserDisplayName(user.firstName, user.email),
                    device,
                    location,
                    time,
                    resetUrl: actionLink,
                }),
            });

            logger.info('New login activity email sent', {
                email,
                userId: user.id,
            });
        } catch (error: any) {
            logger.error('Failed to send new login activity email', {
                email,
                error: error?.message,
                status: error?.status,
                code: error?.code,
            });
        }
    }

    private async createRecoveryLink(email: string) {
        if (this.recoveryLinkGenerator) {
            return this.recoveryLinkGenerator(email);
        }

        return generatePasswordRecoveryLink({
            supabase: this.supabase,
            email,
        });
    }
}

const loginInstance = new Login();

export default loginInstance;
