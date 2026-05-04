import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { ModerationRepository } from '../../repository';

export class ListMyBlocks {
    constructor(private readonly moderationRepository: ModerationRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const blocks = await this.moderationRepository.listBlocks(userId);

        return {
            code: HttpStatus.OK,
            message: 'Blocks Retrieved Successfully',
            data: blocks,
        };
    };
}

const listMyBlocks = new ListMyBlocks(new ModerationRepository());
export default listMyBlocks;
