import { logger } from '@/core';
import { Activity, ActivityTypeEnum, User } from './interfaces';
import { NotificationPreferenceRepository, UserRepository, ActivityRepository } from './repository';

export async function getUserByIdEventListener(id: string, fields?: (keyof User)[]): Promise<Partial<User> | null> {
    const userRepository = new UserRepository();
    // @ts-expect-error — User field keys don't match DB column keys due to camelCase mapping
    const existingUser = await userRepository.findById(id, fields);
    if (!existingUser) return null;

    const convertedUser = userRepository.mapToCamelCase(existingUser);
    if (!convertedUser) return null;

    return convertedUser;
}

type NotificationPreferenceTopic = 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts' | 'marketingEnabled';
type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

// Per-topic-per-channel matrix. Missing entries (e.g. SMS for message_updates
// or marketing) are intentional — product's opt-in policy does not want us
// texting those topics even if the user has SMS enabled globally.
const SMS_COLUMN_BY_TOPIC: Partial<Record<NotificationPreferenceTopic, 'smsGigUpdates' | 'smsPaymentUpdates' | 'smsSecurityAlerts'>> = {
    gigUpdates: 'smsGigUpdates',
    paymentUpdates: 'smsPaymentUpdates',
    securityAlerts: 'smsSecurityAlerts',
};

const PUSH_COLUMN_BY_TOPIC: Partial<
    Record<NotificationPreferenceTopic, 'pushGigUpdates' | 'pushMessageUpdates' | 'pushPaymentUpdates' | 'pushSecurityAlerts'>
> = {
    gigUpdates: 'pushGigUpdates',
    paymentUpdates: 'pushPaymentUpdates',
    messageUpdates: 'pushMessageUpdates',
    securityAlerts: 'pushSecurityAlerts',
};

export async function checkNotificationPreferenceEventListener(input: {
    userId: string;
    preferenceKey?: NotificationPreferenceTopic;
    channel?: NotificationChannel;
}): Promise<boolean> {
    const notificationPreferenceRepository = new NotificationPreferenceRepository();
    const preferences =
        (await notificationPreferenceRepository.findByUserId(input.userId)) ??
        (await notificationPreferenceRepository.upsertByUserId(input.userId, {}));

    // in_app / bell icon is the primary UI surface — never channel-gated.
    if (!input.channel || input.channel === 'in_app') {
        if (input.preferenceKey && preferences[input.preferenceKey] === false) return false;
        return true;
    }

    // Global channel envelope: disabling email / push / sms silences that
    // channel regardless of per-topic settings.
    if (input.channel === 'email' && preferences.emailEnabled === false) return false;
    if (input.channel === 'push' && preferences.pushEnabled === false) return false;
    if (input.channel === 'sms' && preferences.smsEnabled === false) return false;

    if (!input.preferenceKey) return true;

    // Email keeps the single-axis topic columns (gig_updates /
    // payment_updates / message_updates / security_alerts /
    // marketing_enabled). SMS and push use the per-topic-per-channel matrix
    // from migration 20260503 so we don't text users about message updates
    // even when SMS is globally on.
    if (input.channel === 'email') {
        return preferences[input.preferenceKey] !== false;
    }

    if (input.channel === 'sms') {
        const column = SMS_COLUMN_BY_TOPIC[input.preferenceKey];
        if (!column) return false;
        return preferences[column] !== false;
    }

    if (input.channel === 'push') {
        const column = PUSH_COLUMN_BY_TOPIC[input.preferenceKey];
        if (!column) return false;
        return preferences[column] !== false;
    }

    return true;
}

export async function createActivityEventListener(input: {
    userId: string;
    type: string;
    targetId?: string;
    targetType?: string;
    description?: string;
}): Promise<Activity> {
    const activityRepository = new ActivityRepository();
    const activity = await activityRepository.logActivity(
        input.userId,
        input.type as ActivityTypeEnum,
        input.targetId,
        input.description ? { description: input.description, targetType: input.targetType } : undefined,
    );
    return activity;
}

export function onboardingStepCompletedEventListener(input: { userId: string; step: 1 | 2 | 3; role: User['role'] | null }): void {
    logger.info('Onboarding step completed', {
        userId: input.userId,
        step: input.step,
        role: input.role,
    });
}
