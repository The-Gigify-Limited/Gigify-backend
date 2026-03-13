import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationRepository } from '../../repository';

export class MarkAllNotificationsRead {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.notificationRepository.markAllAsRead(userId);

        return {
            code: HttpStatus.OK,
            message: 'Notifications Marked as Read Successfully',
        };
    };
}

const markAllNotificationsRead = new MarkAllNotificationsRead(new NotificationRepository());
export default markAllNotificationsRead;
