import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationRepository } from '../../repository';

export class GetUnreadNotificationCount {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const unreadCount = await this.notificationRepository.getUnreadCount(userId);

        return {
            code: HttpStatus.OK,
            message: 'Unread Notification Count Retrieved Successfully',
            data: {
                unreadCount,
            },
        };
    };
}

const getUnreadNotificationCount = new GetUnreadNotificationCount(new NotificationRepository());
export default getUnreadNotificationCount;
