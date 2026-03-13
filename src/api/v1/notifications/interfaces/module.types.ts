import { DatabaseEnum, DatabaseTable, Json } from '@/core/types';

export type DatabaseNotification = DatabaseTable['notifications']['Row'];
export type NotificationChannelEnum = DatabaseEnum['notification_channel'];
export type NotificationTypeEnum = DatabaseEnum['notification_type'];

export type Notification = {
    id: string;
    userId: string;
    type: NotificationTypeEnum;
    title: string;
    message: string | null;
    channel: NotificationChannelEnum;
    payload: Json;
    isRead: boolean;
    readAt: string | null;
    sentAt: string | null;
    createdAt: string;
};
