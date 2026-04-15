import { AppEventManager } from '@/app/app-events/app.events';
import { realtimeService } from '@/core';
import { Json } from '@/core/types';
import { Notification, NotificationChannelEnum, NotificationTypeEnum } from './interfaces';
import { NotificationRepository } from './repository';

export type NotificationPreferenceTopic = 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts' | 'marketingEnabled';

export async function dispatchNotificationEventListener(input: {
    userId: string;
    type: NotificationTypeEnum;
    title: string;
    message?: string | null;
    channel?: NotificationChannelEnum;
    payload?: Json;
    preferenceKey?: NotificationPreferenceTopic;
    appEventManager?: AppEventManager;
}): Promise<Notification | null> {
    const notificationRepository = new NotificationRepository();

    if (input.preferenceKey && input.appEventManager) {
        const shouldSend = await input.appEventManager.dispatch('user:check-notification-preference', {
            userId: input.userId,
            preferenceKey: input.preferenceKey,
        });

        if (!shouldSend) {
            return null;
        }
    }

    const notification = await notificationRepository.createNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        channel: input.channel ?? 'in_app',
        payload: input.payload ?? {},
        sentAt: new Date().toISOString(),
    });

    await realtimeService.broadcastToUser(input.userId, 'new_notification', notification);

    return notification;
}
