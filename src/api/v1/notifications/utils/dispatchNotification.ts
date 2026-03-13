import { Json } from '@/core/types';
import { NotificationChannelEnum, NotificationTypeEnum } from '../interfaces';
import { NotificationRepository } from '../repository';
import { NotificationPreferenceRepository } from '~/user/repository';

export type NotificationPreferenceTopic = 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts' | 'marketingEnabled';

export class NotificationDispatcher {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly notificationPreferenceRepository: NotificationPreferenceRepository,
    ) {}

    async dispatch(input: {
        userId: string;
        type: NotificationTypeEnum;
        title: string;
        message?: string | null;
        channel?: NotificationChannelEnum;
        payload?: Json;
        preferenceKey?: NotificationPreferenceTopic;
    }) {
        const preferences =
            (await this.notificationPreferenceRepository.findByUserId(input.userId)) ??
            (await this.notificationPreferenceRepository.upsertByUserId(input.userId, {}));

        if (input.preferenceKey && preferences[input.preferenceKey] === false) {
            return null;
        }

        return this.notificationRepository.createNotification({
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message ?? null,
            channel: input.channel ?? 'in_app',
            payload: input.payload ?? {},
            sentAt: new Date().toISOString(),
        });
    }
}

export const notificationDispatcher = new NotificationDispatcher(new NotificationRepository(), new NotificationPreferenceRepository());
