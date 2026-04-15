import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserReviewsDto } from '~/user/interfaces';

export class GetUserReviews {
    handle = async ({ params, query }: ControllerArgs<GetUserReviewsDto>) => {
        if (!params?.id) throw new BadRequestError('User ID is required');

        const [data] = await dispatch('talent:get-reviews', {
            talentId: params.id,
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 10,
        });

        return {
            code: HttpStatus.OK,
            message: 'User Reviews Retrieved Successfully',
            data,
        };
    };
}

const getUserReviews = new GetUserReviews();

export default getUserReviews;
