import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { SavedTalentsQueryDto } from '../../interfaces';
import { SavedTalentRepository } from '../../repository';

export class GetSavedTalents {
    constructor(private readonly savedTalentRepository: SavedTalentRepository) {}

    handle = async ({ query, request }: ControllerArgs<SavedTalentsQueryDto>) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const savedTalents = await this.savedTalentRepository.getSavedTalentsForUser(userId, query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Saved Talents Retrieved Successfully',
            data: savedTalents,
        };
    };
}

const getSavedTalents = new GetSavedTalents(new SavedTalentRepository());
export default getSavedTalents;
