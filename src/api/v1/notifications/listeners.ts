import { AppEventManager } from '@/app/app-events/app.events';
import { logger, realtimeService } from '@/core';
import { sendEmail } from '@/core/services/mails';
import { notificationMail } from '@/core/services/mails/views/gigify-auth.view';
import { sendSMS } from '@/core/services/sms/sms.service';
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
    const channel = input.channel ?? 'in_app';

    // Realtime broadcast and the in-app notification row are the frontend's
    // primary UI surface, they must fire even when the user has opted out
    // of a given topic, otherwise the bell icon goes stale and the UI never
    // learns about state changes. Only opt-in-style channels (email, sms,
    // push) are preference-gated below. Default allows the send when the
    // preference listener is unavailable so missing infrastructure never
    // silently suppresses delivery.
    const channelAllowed = await resolveChannelPreference(input.userId, input.preferenceKey, channel, input.appEventManager);

    const notification = await notificationRepository.createNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        channel,
        payload: input.payload ?? {},
        sentAt: new Date().toISOString(),
    });

    await realtimeService.broadcastToUser(input.userId, 'new_notification', notification);

    if (!channelAllowed) return notification;

    if (channel === 'email') {
        await sendNotificationEmail(input.userId, input.title, input.message ?? '', input.appEventManager);
    } else if (channel === 'sms') {
        await sendNotificationSms(input.userId, input.title, input.message ?? '', input.appEventManager);
    } else if (channel === 'push') {
        await queueNotificationPush(input.userId, input.title, input.message ?? '', input.payload ?? {});
    }

    return notification;
}

async function resolveChannelPreference(
    userId: string,
    preferenceKey: NotificationPreferenceTopic | undefined,
    channel: NotificationChannelEnum,
    appEventManager?: AppEventManager,
): Promise<boolean> {
    if (channel === 'in_app') return true;
    if (!preferenceKey || !appEventManager) return true;

    const results = await appEventManager.dispatch('user:check-notification-preference', {
        userId,
        preferenceKey,
        channel,
    });
    if (results.length === 0) return true;
    return results.every((result) => result !== false);
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

async function sendNotificationSms(userId: string, title: string, message: string, appEventManager?: AppEventManager): Promise<void> {
    try {
        const user = await loadUser(userId, appEventManager);
        if (!user?.phoneNumber) {
            logger.warn(`Cannot send notification SMS: user ${userId} has no phone number`);
            return;
        }

        // Keep SMS short, Twilio will split long bodies into multiple
        // segments and bill per segment. Title gives the "what", message is
        // truncated context.
        const body = message ? `${title}: ${message}`.slice(0, 300) : title;

        await sendSMS({ phoneNumber: user.phoneNumber, body });
    } catch (error: any) {
        logger.error('Failed to send notification SMS', {
            userId,
            error: error?.message,
            code: error?.code,
        });
    }
}

async function queueNotificationPush(userId: string, title: string, message: string, payload: Json): Promise<void> {
    // Stub until Phase 5 wires FCM/APNS. ENABLE_PUSH gates the log so we can
    // prove preference + channel routing is correct in staging without
    // polluting logs in environments that don't care about push yet.
    if (process.env.ENABLE_PUSH !== '1') return;

    logger.info('Push notification queued (stub)', {
        userId,
        title,
        message,
        payload,
    });
}

async function loadUser(
    userId: string,
    appEventManager?: AppEventManager,
): Promise<{ email?: string | null; phoneNumber?: string | null; firstName?: string | null } | null> {
    if (appEventManager) {
        const [userData] = await appEventManager.dispatch('user:get-by-id', { id: userId });
        return userData ?? null;
    }
    const { dispatch } = await import('@/app');
    const [userData] = await dispatch('user:get-by-id', { id: userId });
    return userData ?? null;
}
