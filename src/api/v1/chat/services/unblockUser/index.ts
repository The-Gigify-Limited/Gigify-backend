import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { UnblockUserDto } from '../../interfaces';
import { ModerationRepository } from '../../repository';

export class UnblockUser {
    constructor(private readonly moderationRepository: ModerationRepository) {}

    handle = async ({ params, request }: ControllerArgs<UnblockUserDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.moderationRepository.removeBlock(userId, params.userId);

        return {
            code: HttpStatus.OK,
            message: 'User Unblocked Successfully',
        };
    };
}

const unblockUser = new UnblockUser(new ModerationRepository());
export default unblockUser;
