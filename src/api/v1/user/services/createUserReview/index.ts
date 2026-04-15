import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { ActivityRepository } from '~/user/repository';
import { CreateUserReviewDto } from '../../interfaces';

export class CreateUserReview {
    constructor(private readonly activityRepository: ActivityRepository) {}

    handle = async ({ input, request }: ControllerArgs<CreateUserReviewDto>) => {
        const reviewerId = request.user?.id;

        if (!reviewerId) throw new UnAuthorizedError('User not authenticated');
        if (!input?.revieweeId) throw new BadRequestError('Review target is required');
        if (input.revieweeId === reviewerId) throw new BadRequestError('You cannot review yourself');

        const [createdReview] = await dispatch('talent:create-review', {
            revieweeId: input.revieweeId,
            reviewerId,
            gigId: input.gigId,
            comment: input.comment,
            rating: input.rating,
        });

        if (!createdReview) throw new Error('Failed to create review');

        await this.activityRepository.logActivity(reviewerId, 'review_posted', createdReview.id, {
            revieweeId: input.revieweeId,
            gigId: input.gigId ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Review Created Successfully',
            data: createdReview,
        };
    };
}

const createUserReview = new CreateUserReview(new ActivityRepository());

export default createUserReview;
