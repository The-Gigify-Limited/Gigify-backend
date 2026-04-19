import { AppEventManager } from '@/app/app-events/app.events';
import { logger, realtimeService } from '@/core';
import { sendEmail } from '@/core/services/mails';
import { notificationMail } from '@/core/services/mails/views/gigify-auth.view';
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

    // Realtime broadcast and the in-app notification row are the frontend's
    // primary UI surface — they must fire even when the user has opted out
    // of a given topic, otherwise the bell icon goes stale and the UI never
    // learns about state changes. Only the email (and any other
    // opt-in-style channel) is preference-gated below. Default allows the
    // send when the preference listener is unavailable or returns nothing,
    // so missing infrastructure never silently suppresses mail.
    let emailAllowed = true;
    if (input.preferenceKey && input.appEventManager) {
        const results = await input.appEventManager.dispatch('user:check-notification-preference', {
            userId: input.userId,
            preferenceKey: input.preferenceKey,
        });

        if (results.length > 0) {
            emailAllowed = results.every((result) => result !== false);
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

    if (input.channel === 'email' && emailAllowed) {
        await sendNotificationEmail(input.userId, input.title, input.message ?? '', input.appEventManager);
    }

    return notification;
}

async function sendNotificationEmail(userId: string, title: string, message: string, appEventManager?: AppEventManager): Promise<void> {
    try {
        let user;

        if (appEventManager) {
            const [userData] = await appEventManager.dispatch('user:get-by-id', { id: userId });
            user = userData;
        } else {
            const { dispatch } = await import('@/app');
            const [userData] = await dispatch('user:get-by-id', { id: userId });
            user = userData;
        }

        if (!user?.email) {
            logger.warn(`Cannot send notification email: user ${userId} has no email`);
            return;
        }

        const firstName = user.firstName || user.email.split('@')[0];

        await sendEmail({
            to: user.email,
            subject: title,
            body: notificationMail({
                firstName,
                title,
                message,
            }),
        });
    } catch (error: any) {
        logger.error('Failed to send notification email', {
            userId,
            error: error?.message,
            code: error?.code,
        });
    }
}
