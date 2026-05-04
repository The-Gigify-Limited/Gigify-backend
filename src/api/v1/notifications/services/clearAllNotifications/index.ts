import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationRepository } from '../../repository';

export class ClearAllNotifications {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.notificationRepository.deleteAllForUser(userId);

        return {
            code: HttpStatus.OK,
            message: 'All Notifications Cleared Successfully',
        };
    };
}

const clearAllNotifications = new ClearAllNotifications(new NotificationRepository());
export default clearAllNotifications;
