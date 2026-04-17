import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { GetTalentParamsDto } from '~/talents/interfaces';
import { TalentPortfolioRepository, TalentRepository, TalentReviewRepository } from '~/talents/repository';

export class GetTalentById {
    constructor(
        private readonly talentRepository: TalentRepository,
        private readonly talentPortfolioRepository: TalentPortfolioRepository,
        private readonly talentReviewRepository: TalentReviewRepository,
    ) {}

    handle = async ({ params }: ControllerArgs<GetTalentParamsDto>) => {
        if (!params?.id) throw new BadRequestError('Talent user ID is required');

        const talent = await this.talentRepository.findByUserId(params.id);

        if (!talent) throw new RouteNotFoundError('Talent profile not found');

        const [portfolios, reviews, averageRating, totalGigsCompleted] = await Promise.all([
            this.talentPortfolioRepository.findByTalentId(talent.id),
            this.talentReviewRepository.findMany({
                filters: {
                    talent_id: params.id,
                },
                pagination: {
                    page: 1,
                    pageSize: 20,
                },
                orderBy: {
                    column: 'created_at',
                    ascending: false,
                },
            }),
            this.talentReviewRepository.findTalentAverageRating(params.id),
            this.talentRepository.countCompletedGigs(params.id),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Talent Retrieved Successfully',
            data: {
                ...talent,
                portfolios,
                reviews: reviews.map(this.talentReviewRepository.mapToCamelCase),
                averageRating,
                totalGigsCompleted,
            },
        };
    };
}

const getTalentById = new GetTalentById(new TalentRepository(), new TalentPortfolioRepository(), new TalentReviewRepository());

export default getTalentById;
