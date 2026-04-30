import { dispatch } from '@/app';
import { BadRequestError, BaseService, ConflictError, ControllerArgs, HttpStatus, logger } from '@/core';
import { sendEmail, welcomeOnboardingMail, welcomeEmployerMail } from '@/core/services/mails';
import { UserRepository } from '~/user/repository';
import { resolveUserDisplayName } from '../../utils/passwordRecovery';
import { SetUserRolePayload } from '../../interface';

export class SetUserRole extends BaseService {
    constructor(private readonly userRepository: UserRepository, private readonly emailSender: typeof sendEmail = sendEmail) {
        super();
    }

    handle = async ({ input }: ControllerArgs<SetUserRolePayload>) => {
        if (!input) throw new BadRequestError(`Invalid credentials`);

        const { role, userId } = input;

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ConflictError('User not found.');
        }

        // Role is immutable once set. Role-switch flows (e.g. the Figma settings
        // page's "switch account type" button) are intentionally unsupported at
        // the backend level, see FIGMA_GAP_PLAN.md PR 1.6. A dedicated switch-role
        // service with profile cleanup and onboarding reset would need to be built
        // before any UI exposes this capability.
        if (user.role) {
            throw new ConflictError(user.role === role ? 'User role already set.' : 'Role switching is not supported.');
        }

        const updatedUserRow = await this.userRepository.updateById(userId, {
            role,
            onboardingStep: Math.max(user.onboarding_step ?? 0, 1),
        });

        const updatedUser = this.userRepository.mapToCamelCase(updatedUserRow);

        if (role == 'employer') {
            const [employerProfile] = await dispatch('employer:create-profile', { user_id: userId });

            if (!employerProfile) throw new Error('Failed to create employer profile');

            await this.sendWelcomeEmployerEmail(updatedUser.email, updatedUser.firstName);
        }

        if (role == 'talent') {
            const [talent] = await dispatch('talent:create-talent', { user_id: userId });

            if (!talent) throw new Error('Failed to create talent profile');

            await this.sendWelcomeEmail(updatedUser.email, updatedUser.firstName);
        }

        logger.info('User Account Created Successfully');

        return {
            data: updatedUser,
            code: HttpStatus.CREATED,
            message: 'User Role Set Successfully',
        };
    };

    private async sendWelcomeEmail(email: string | null, firstName: string | null) {
        if (!email) return;

        try {
            await this.emailSender({
                to: email,
                subject: "You're In! Let's Get You Booked on Gigify",
                body: welcomeOnboardingMail({
                    firstName: resolveUserDisplayName(firstName, email),
                }),
            });
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            logger.error('Failed to send welcome onboarding email', {
                email,
                error: err?.message,
                status: err?.status,
                code: err?.code,
            });
        }
    }

    private async sendWelcomeEmployerEmail(email: string | null, firstName: string | null) {
        if (!email) return;

        try {
            await this.emailSender({
                to: email,
                subject: 'Welcome to Gigify - Start Posting Gigs',
                body: welcomeEmployerMail({
                    firstName: resolveUserDisplayName(firstName, email),
                }),
            });
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            logger.error('Failed to send welcome employer email', {
                email,
                error: err?.message,
                status: err?.status,
                code: err?.code,
            });
        }
    }
}

const setUserRoleInstance = new SetUserRole(new UserRepository());

export default setUserRoleInstance;
