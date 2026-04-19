import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationParamsDto } from '../../interfaces';
import { NotificationRepository } from '../../repository';

export class DeleteNotification {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    handle = async ({ params, request }: ControllerArgs<NotificationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.notificationRepository.deleteNotification(params.id, userId);

        return {
            code: HttpStatus.OK,
            message: 'Notification Deleted Successfully',
        };
    };
}

const deleteNotification = new DeleteNotification(new NotificationRepository());
export default deleteNotification;
