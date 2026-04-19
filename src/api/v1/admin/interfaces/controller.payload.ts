import type { ControllerArgsTypes } from '@/core';
import { AuditResultEnum, UserStatusEnum } from './module.types';
import { NotificationChannelEnum, NotificationTypeEnum } from '~/notifications/interfaces';
import { ReportStatusEnum } from '~/gigs/interfaces';
import { PayoutExternalProviderEnum, PayoutStatusEnum } from '~/earnings/interfaces';
import { IdentityVerificationStatusEnum, UserRoleEnum } from '~/user/interfaces';
import { GigStatusEnum } from '~/gigs/interfaces';

export interface AdminUsersQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        role?: UserRoleEnum;
        status?: UserStatusEnum;
        search?: string;
    };
}

export interface AdminUserStatusDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: UserStatusEnum;
    };
}

export interface AdminReportsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: ReportStatusEnum;
    };
}

export interface AdminReportUpdateDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: ReportStatusEnum;
        resolutionNote?: string | null;
    };
}

export interface AdminPayoutRequestsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: PayoutStatusEnum;
    };
}

export interface AdminPayoutRequestUpdateDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: PayoutStatusEnum;
        externalTransferId?: string;
        externalProvider?: PayoutExternalProviderEnum;
    };
}

export interface AdminIdentityVerificationQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: IdentityVerificationStatusEnum;
    };
}

export interface AdminIdentityVerificationUpdateDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: IdentityVerificationStatusEnum;
        notes?: string | null;
    };
}

export interface AdminAuditLogsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        userId?: string;
        result?: AuditResultEnum;
        resourceType?: string;
        action?: string;
    };
}

export interface AdminBroadcastNotificationDto extends ControllerArgsTypes {
    input: {
        role?: UserRoleEnum;
        status?: UserStatusEnum;
        title: string;
        message: string;
        type?: NotificationTypeEnum;
        channel?: NotificationChannelEnum;
    };
}

export interface AdminGigsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: GigStatusEnum;
        employerId?: string;
        search?: string;
    };
}

export interface AdminGigStatusUpdateDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: GigStatusEnum;
    };
}
