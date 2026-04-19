import { BadRequestError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { BlockUserDto } from '../../interfaces';
import { ModerationRepository } from '../../repository';

export class BlockUser {
    constructor(private readonly moderationRepository: ModerationRepository) {}

    handle = async ({ input, request }: ControllerArgs<BlockUserDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (input.userId === userId) throw new BadRequestError('You cannot block yourself');

        const block = await this.moderationRepository.createBlock({
            blockerId: userId,
            blockedId: input.userId,
            reason: input.reason ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'User Blocked Successfully',
            data: block,
        };
    };
}

const blockUser = new BlockUser(new ModerationRepository());
export default blockUser;
