import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { UpdateTalentDto } from '~/talents/interfaces';
import { TalentRepository } from '~/talents/repository';

export class UpdateTalentById {
    constructor(private readonly talentRepository: TalentRepository) {}

    handle = async (payload: ControllerArgs<UpdateTalentDto>) => {
        const { params, input } = payload;

        if (!params?.id) throw new BadRequestError(`No Talent ID Found!`);

        const existingTalent = await this.talentRepository.findByUserId(params.id);

        if (!existingTalent?.id) throw new RouteNotFoundError('Talent profile not found');

        const updatedTalent = await this.talentRepository.updateById(existingTalent.id, input);
        const convertedTalent = this.talentRepository.mapToCamelCase(updatedTalent);

        return {
            code: HttpStatus.OK,
            message: 'Talent Updated Successfully',
            data: convertedTalent,
        };
    };
}

const updateTalentById = new UpdateTalentById(new TalentRepository());

export default updateTalentById;
