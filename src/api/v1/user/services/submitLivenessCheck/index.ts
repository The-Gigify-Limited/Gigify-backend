import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { IdentityVerificationRepository, UserRepository } from '~/user/repository';
import { SubmitLivenessDto } from '../../interfaces';

export class SubmitLivenessCheck {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository, private readonly userRepository: UserRepository) {}

    handle = async ({ input, request }: ControllerArgs<SubmitLivenessDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const submission = await this.identityVerificationRepository.submit(userId, input);
        const currentUser = await this.userRepository.findById(userId);

        if (currentUser) {
            const nextStep = Math.max(currentUser.onboarding_step ?? 0, 3);
            await this.userRepository.updateById(userId, { onboardingStep: nextStep });
        }

        return {
            code: HttpStatus.CREATED,
            message: 'Verification Submitted Successfully',
            data: submission,
        };
    };
}

const submitLivenessCheck = new SubmitLivenessCheck(new IdentityVerificationRepository(), new UserRepository());

export default submitLivenessCheck;
