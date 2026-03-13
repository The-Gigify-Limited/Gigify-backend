import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationPreferenceRepository } from '~/user/repository';

export class GetNotificationPreferences {
    constructor(private readonly notificationPreferenceRepository: NotificationPreferenceRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const preferences =
            (await this.notificationPreferenceRepository.findByUserId(userId)) ??
            (await this.notificationPreferenceRepository.upsertByUserId(userId, {}));

        return {
            code: HttpStatus.OK,
            message: 'Notification Preferences Retrieved Successfully',
            data: preferences,
        };
    };
}

const getNotificationPreferences = new GetNotificationPreferences(new NotificationPreferenceRepository());

export default getNotificationPreferences;
