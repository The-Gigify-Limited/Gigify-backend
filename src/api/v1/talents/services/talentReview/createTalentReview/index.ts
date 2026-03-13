import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { CreateTalentReviewDto } from '~/talents/interfaces';
import { TalentReviewRepository } from '~/talents/repository';

export class CreateTalentReview {
    constructor(private readonly talentReviewRepository: TalentReviewRepository) {}

    handle = async (payload: ControllerArgs<CreateTalentReviewDto>) => {
        const { params, input, request } = payload;

        const { id: talentId } = params;
        const reviewerId = request.user?.id;

        if (!reviewerId) throw new UnAuthorizedError('User not authenticated');

        const createdReview = await this.talentReviewRepository.createTalentReview(talentId, {
            ...input,
            reviewerId,
        });

        if (!createdReview) throw new Error('Failed to create review');

        return {
            code: HttpStatus.CREATED,
            message: 'Review Created Successfully',
            data: createdReview,
        };
    };
}

const createTalentReview = new CreateTalentReview(new TalentReviewRepository());

export default createTalentReview;
