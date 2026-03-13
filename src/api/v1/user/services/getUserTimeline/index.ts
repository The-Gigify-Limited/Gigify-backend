import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { ActivityRepository } from '~/user/repository';
import { GetUserTimelineDto } from '../../interfaces';

export class GetUserTimeline {
    constructor(private readonly activityRepository: ActivityRepository) {}

    handle = async ({ query, request }: ControllerArgs<GetUserTimelineDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const activities = await this.activityRepository.getUserTimeline(userId, query);

        return {
            code: HttpStatus.OK,
            message: 'User Timeline Retrieved Successfully',
            data: activities,
        };
    };
}

const getUserTimeline = new GetUserTimeline(new ActivityRepository());

export default getUserTimeline;
