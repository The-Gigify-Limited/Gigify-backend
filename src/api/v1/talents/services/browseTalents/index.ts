import { ControllerArgs, HttpStatus } from '@/core';
import { BrowseTalentsQueryDto } from '../../interfaces';
import { TalentRepository } from '../../repository';

export class BrowseTalents {
    constructor(private readonly talentRepository: TalentRepository) {}

    handle = async ({ query }: ControllerArgs<BrowseTalentsQueryDto>) => {
        const talents = await this.talentRepository.findForBrowse(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Talents Retrieved Successfully',
            data: talents,
        };
    };
}

const browseTalents = new BrowseTalents(new TalentRepository());
export default browseTalents;
