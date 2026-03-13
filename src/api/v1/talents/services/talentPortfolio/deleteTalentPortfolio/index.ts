import { BadRequestError, ControllerArgs, HttpStatus, ForbiddenError, UnAuthorizedError } from '@/core';
import { TalentPortfolioParamDTO } from '~/talents/interfaces';
import { TalentPortfolioRepository, TalentRepository } from '~/talents/repository';

export class DeleteTalentPortfolio {
    constructor(private readonly talentPortfolioRepository: TalentPortfolioRepository, private readonly talentRepository: TalentRepository) {}

    handle = async (payload: ControllerArgs<TalentPortfolioParamDTO>) => {
        const { params, request } = payload;

        if (!params) throw new BadRequestError(`Invalid Talent Portfolio ID`);

        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const { talentPortfolioId } = params;
        const talent = await this.talentRepository.findByUserId(userId);
        const portfolio = await this.talentPortfolioRepository.findById(talentPortfolioId);

        if (!portfolio) throw new BadRequestError('Talent Portfolio not Found!');
        if (!talent?.id) throw new UnAuthorizedError(`Talent not found! You're not registered as a talent.`);
        if (portfolio.talent_id !== talent.id) throw new ForbiddenError('You do not have access to this portfolio item');

        await this.talentPortfolioRepository.deleteTalentPortfolio(talentPortfolioId);

        return {
            code: HttpStatus.NO_CONTENT,
            message: 'Talent Portfolio Deleted Successfully',
        };
    };
}

const deleteTalentPortfolio = new DeleteTalentPortfolio(new TalentPortfolioRepository(), new TalentRepository());

export default deleteTalentPortfolio;
