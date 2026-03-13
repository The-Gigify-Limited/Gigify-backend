import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationsQueryDto } from '../../interfaces';
import { NotificationRepository } from '../../repository';

export class GetMyNotifications {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ query, request }: ControllerArgs<NotificationsQueryDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const notifications = await this.notificationRepository.getNotificationsForUser(userId, query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Notifications Retrieved Successfully',
            data: notifications,
        };
    };
}

const getMyNotifications = new GetMyNotifications(new NotificationRepository());
export default getMyNotifications;
