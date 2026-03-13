import { DatabaseEnum, DatabaseTable } from '@/core/types';
import { User } from '~/user/interfaces';

export type DatabaseAuditLog = DatabaseTable['audit_logs']['Row'];
export type AuditResultEnum = DatabaseEnum['audit_result'];
export type UserStatusEnum = DatabaseEnum['user_status'];

export type AuditLog = {
    id: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes: Record<string, unknown> | null;
    result: AuditResultEnum;
    ipAddress: string | null;
    userAgent: string | null;
    errorMessage: string | null;
    createdAt: string;
};

export type AdminDashboardSummary = {
    users: {
        total: number;
        active: number;
        suspended: number;
        talent: number;
        employer: number;
        admin: number;
    };
    gigs: {
        total: number;
        open: number;
        inProgress: number;
        completed: number;
        cancelled: number;
    };
    operations: {
        openReports: number;
        pendingPayoutRequests: number;
        pendingVerifications: number;
        pendingPayments: number;
    };
};

export type AdminUserListItem = User;
