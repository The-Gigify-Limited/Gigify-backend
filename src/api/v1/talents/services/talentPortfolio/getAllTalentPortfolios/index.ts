import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { TalentParamDTO } from '~/talents/interfaces';
import { TalentPortfolioRepository } from '~/talents/repository';

export class GetTalentPortfolios {
    constructor(private readonly talentPortfolioRepository: TalentPortfolioRepository) {}

    handle = async (payload: ControllerArgs<TalentParamDTO>) => {
        const { params } = payload;

        if (!params?.id) throw new BadRequestError(`No User ID Found!`);

        const { id } = params;

        const talentPortfolio = await this.talentPortfolioRepository.findByTalentId(id);

        return {
            code: HttpStatus.OK,
            message: 'Talent Portfolio Retrieved Successfully',
            data: talentPortfolio,
        };
    };
}

const getTalentPortfolios = new GetTalentPortfolios(new TalentPortfolioRepository());

export default getTalentPortfolios;
