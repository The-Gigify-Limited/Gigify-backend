import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { SavedTalentParamsDto } from '../../interfaces';
import { SavedTalentRepository, TalentRepository } from '../../repository';

export class SaveTalent {
    constructor(private readonly talentRepository: TalentRepository, private readonly savedTalentRepository: SavedTalentRepository) {}

    handle = async ({ params, request }: ControllerArgs<SavedTalentParamsDto>) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (userId === params.id) throw new BadRequestError('You cannot save yourself');

        const talent = await this.talentRepository.findByUserId(params.id);
        if (!talent) throw new RouteNotFoundError('Talent not found');

        const savedTalent = await this.savedTalentRepository.saveTalent(userId, params.id);

        return {
            code: HttpStatus.OK,
            message: 'Talent Saved Successfully',
            data: savedTalent,
        };
    };
}

const saveTalent = new SaveTalent(new TalentRepository(), new SavedTalentRepository());
export default saveTalent;
