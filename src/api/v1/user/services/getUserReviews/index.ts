import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserReviewsDto } from '~/user/interfaces';
import { TalentReviewRepository } from '~/talents/repository';

export class GetUserReviews {
    constructor(private readonly talentReviewRepository: TalentReviewRepository) {}

    handle = async ({ params, query }: ControllerArgs<GetUserReviewsDto>) => {
        if (!params?.id) throw new BadRequestError('User ID is required');

        const reviews = await this.talentReviewRepository.findMany({
            filters: {
                talent_id: params.id,
            },
            pagination: {
                page: query.page ?? 1,
                pageSize: query.pageSize ?? 10,
            },
            orderBy: {
                column: 'created_at',
                ascending: false,
            },
        });

        const summary = await this.talentReviewRepository.findTalentRatingSummary(params.id);

        return {
            code: HttpStatus.OK,
            message: 'User Reviews Retrieved Successfully',
            data: {
                reviews: reviews.map(this.talentReviewRepository.mapToCamelCase),
                summary,
            },
        };
    };
}

const getUserReviews = new GetUserReviews(new TalentReviewRepository());

export default getUserReviews;
