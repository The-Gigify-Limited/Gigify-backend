import type { ControllerArgsTypes } from '@/core';
import { NotificationTypeEnum } from './module.types';

export interface NotificationsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        isRead?: boolean;
        type?: NotificationTypeEnum;
    };
}

export interface NotificationParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}
