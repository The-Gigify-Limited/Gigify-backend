import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationParamsDto } from '../../interfaces';
import { NotificationRepository } from '../../repository';

export class MarkNotificationRead {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ params, request }: ControllerArgs<NotificationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const notification = await this.notificationRepository.markAsRead(params.id, userId);

        return {
            code: HttpStatus.OK,
            message: 'Notification Marked as Read Successfully',
            data: notification,
        };
    };
}

const markNotificationRead = new MarkNotificationRead(new NotificationRepository());
export default markNotificationRead;
