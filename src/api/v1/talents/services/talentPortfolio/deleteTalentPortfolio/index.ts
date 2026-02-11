import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { TalentPortfolioParamDTO } from '~/talents/interfaces';
import { TalentPortfolioRepository } from '~/talents/repository';

export class DeleteTalentPortfolio {
    constructor(private readonly talentPortfolioRepository: TalentPortfolioRepository) {}

    handle = async (payload: ControllerArgs<TalentPortfolioParamDTO>) => {
        const { params } = payload;

        if (!params) throw new BadRequestError(`Invalid Talent Portfolio ID`);

        const { talentPortfolioId } = params;

        await this.talentPortfolioRepository.deleteTalentPortfolio(talentPortfolioId);

        return {
            code: HttpStatus.NO_CONTENT,
            message: 'Talent Portfolio Deleted Successfully',
        };
    };
}

const deleteTalentPortfolio = new DeleteTalentPortfolio(new TalentPortfolioRepository());

export default deleteTalentPortfolio;
