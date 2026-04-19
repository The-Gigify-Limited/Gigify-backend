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

export async function checkNotificationPreferenceEventListener(input: {
    userId: string;
    preferenceKey?: 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts' | 'marketingEnabled';
    channel?: 'email' | 'push' | 'sms' | 'in_app';
}): Promise<boolean> {
    const notificationPreferenceRepository = new NotificationPreferenceRepository();
    const preferences =
        (await notificationPreferenceRepository.findByUserId(input.userId)) ??
        (await notificationPreferenceRepository.upsertByUserId(input.userId, {}));

    if (input.preferenceKey && preferences[input.preferenceKey] === false) {
        return false;
    }

    // Per-channel global opt-out: even if a topic is allowed, the user can
    // silence a whole channel (e.g. marketing emails off, payment push off).
    // in_app is always allowed — it's the bell icon, not an opt-in surface.
    if (input.channel === 'email' && preferences.emailEnabled === false) return false;
    if (input.channel === 'push' && preferences.pushEnabled === false) return false;
    if (input.channel === 'sms' && preferences.smsEnabled === false) return false;

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
