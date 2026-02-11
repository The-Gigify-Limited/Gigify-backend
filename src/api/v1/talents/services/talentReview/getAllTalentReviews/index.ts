import { ControllerArgs, HttpStatus } from '@/core';
import { GetTalentsReviewsQueryDto } from '~/talents/interfaces';
import { TalentReviewRepository } from '~/talents/repository';

export class GetTalentReviews {
    constructor(private readonly talentReviewRepository: TalentReviewRepository) {}

    handle = async (payload: ControllerArgs<GetTalentsReviewsQueryDto>) => {
        const { params, query } = payload;

        const { id: talentId } = params;

        const talentReviews = await this.talentReviewRepository.findMany({
            filters: {
                talent_id: talentId,
            },
            pagination: {
                page: query.page ?? 1,
                pageSize: query.pageSize ?? 10,
            },
        });

        const convertedReviews = talentReviews?.map(this.talentReviewRepository.mapToCamelCase) ?? [];

        const talentRatingSummary = await this.talentReviewRepository.findTalentRatingSummary(talentId);

        return {
            code: HttpStatus.OK,
            message: 'Talent Reviews Retrieved Successfully',
            data: {
                reviews: convertedReviews,
                summary: talentRatingSummary,
            },
        };
    };
}

const getTalentReviews = new GetTalentReviews(new TalentReviewRepository());

export default getTalentReviews;
