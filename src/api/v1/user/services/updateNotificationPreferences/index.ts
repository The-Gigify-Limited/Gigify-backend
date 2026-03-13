import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { NotificationPreferenceRepository } from '~/user/repository';
import { UpdateNotificationPreferencesDto } from '../../interfaces';

export class UpdateNotificationPreferences {
    constructor(private readonly notificationPreferenceRepository: NotificationPreferenceRepository) {}

    handle = async ({ input, request }: ControllerArgs<UpdateNotificationPreferencesDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const preferences = await this.notificationPreferenceRepository.upsertByUserId(userId, input ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Notification Preferences Updated Successfully',
            data: preferences,
        };
    };
}

const updateNotificationPreferences = new UpdateNotificationPreferences(new NotificationPreferenceRepository());

export default updateNotificationPreferences;
