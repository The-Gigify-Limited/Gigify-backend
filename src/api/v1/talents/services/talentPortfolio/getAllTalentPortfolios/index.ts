import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { TalentParamDTO } from '~/talents/interfaces';
import { TalentPortfolioRepository, TalentRepository } from '~/talents/repository';

export class GetTalentPortfolios {
    constructor(private readonly talentPortfolioRepository: TalentPortfolioRepository, private readonly talentRepository: TalentRepository) {}

    handle = async (payload: ControllerArgs<TalentParamDTO>) => {
        const { params } = payload;

        if (!params?.id) throw new BadRequestError(`No User ID Found!`);

        const talent = await this.talentRepository.findByUserId(params.id);

        if (!talent?.id) throw new BadRequestError('Talent not found');

        const talentPortfolio = await this.talentPortfolioRepository.findByTalentId(talent.id);

        return {
            code: HttpStatus.OK,
            message: 'Talent Portfolio Retrieved Successfully',
            data: talentPortfolio,
        };
    };
}

const getTalentPortfolios = new GetTalentPortfolios(new TalentPortfolioRepository(), new TalentRepository());

export default getTalentPortfolios;
