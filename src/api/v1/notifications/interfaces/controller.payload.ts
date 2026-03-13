import type { ControllerArgsTypes } from '@/core';

export interface NotificationsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        isRead?: boolean;
    };
}

export interface NotificationParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}
