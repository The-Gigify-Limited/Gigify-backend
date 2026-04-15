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
}): Promise<boolean> {
    const notificationPreferenceRepository = new NotificationPreferenceRepository();
    const preferences =
        (await notificationPreferenceRepository.findByUserId(input.userId)) ??
        (await notificationPreferenceRepository.upsertByUserId(input.userId, {}));

    if (input.preferenceKey && preferences[input.preferenceKey] === false) {
        return false;
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
