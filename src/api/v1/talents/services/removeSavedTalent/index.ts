import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { SavedTalentParamsDto } from '../../interfaces';
import { SavedTalentRepository } from '../../repository';

export class RemoveSavedTalent {
    constructor(private readonly savedTalentRepository: SavedTalentRepository) {}

    handle = async ({ params, request }: ControllerArgs<SavedTalentParamsDto>) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.savedTalentRepository.removeTalent(userId, params.id);

        return {
            code: HttpStatus.OK,
            message: 'Saved Talent Removed Successfully',
        };
    };
}

const removeSavedTalent = new RemoveSavedTalent(new SavedTalentRepository());
export default removeSavedTalent;
