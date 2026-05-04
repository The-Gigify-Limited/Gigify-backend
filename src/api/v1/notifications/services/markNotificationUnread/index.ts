import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationParamsDto } from '../../interfaces';
import { NotificationRepository } from '../../repository';

export class MarkNotificationUnread {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ params, request }: ControllerArgs<NotificationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const notification = await this.notificationRepository.markAsUnread(params.id, userId);

        return {
            code: HttpStatus.OK,
            message: 'Notification Marked as Unread Successfully',
            data: notification,
        };
    };
}

const markNotificationUnread = new MarkNotificationUnread(new NotificationRepository());
export default markNotificationUnread;
