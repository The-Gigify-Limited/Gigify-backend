import { Json } from '@/core/types';
import { NotificationChannelEnum, NotificationTypeEnum } from '../interfaces';

export type NotificationPreferenceTopic = 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts' | 'marketingEnabled';

export class NotificationDispatcher {
    async dispatch(input: {
        userId: string;
        type: NotificationTypeEnum;
        title: string;
        message?: string | null;
        channel?: NotificationChannelEnum;
        payload?: Json;
        preferenceKey?: NotificationPreferenceTopic;
    }) {
        // Lazy load dispatch to avoid circular dependency at module load time
        const { dispatch } = await import('@/app');
        const [result] = await dispatch('notification:dispatch', input);
        return result;
    }
}

export const notificationDispatcher = new NotificationDispatcher();
