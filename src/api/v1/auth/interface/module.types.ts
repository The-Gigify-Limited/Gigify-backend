import { DatabaseEnum } from '@/core/types';

export type Role = DatabaseEnum['user_role'];

export enum Permission {
    // User Management
    USER_CREATE = 'user:create',
    USER_READ = 'user:read',
    USER_UPDATE = 'user:update',
    USER_DELETE = 'user:delete',

    // Gig Management
    GIG_CREATE = 'gig:create',
    GIG_READ = 'gig:read',
    GIG_UPDATE = 'gig:update',
    GIG_DELETE = 'gig:delete',
    GIG_VIEW_ALL = 'gig:view:all',

    // Payment/Finance
    PAYOUT_REQUEST = 'payout:request',
    PAYMENT_PROCESS = 'payment:process',
    VIEW_EARNINGS = 'view:earnings',

    // Reviews
    REVIEW_CREATE = 'review:create',
    REVIEW_READ = 'review:read',
    REVIEW_DELETE = 'review:delete',
    REVIEW_MODERATE = 'review:moderate',

    // Admin
    SUSPEND_USER = 'suspend:user',
    VIEW_AUDIT_LOGS = 'view:audit:logs',
}

// Role-to-Permission mapping
export const rolePermissions: Record<Role, Permission[]> = {
    talent: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.GIG_CREATE,
        Permission.GIG_READ,
        Permission.GIG_UPDATE,
        Permission.PAYOUT_REQUEST,
        Permission.REVIEW_CREATE,
        Permission.REVIEW_READ,
        Permission.VIEW_EARNINGS,
    ],
    employer: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.GIG_CREATE,
        Permission.GIG_READ,
        Permission.GIG_UPDATE,
        Permission.PAYMENT_PROCESS,
        Permission.REVIEW_CREATE,
        Permission.REVIEW_READ,
    ],


    admin: Object.values(Permission),
};

export type Resources = 'user' | 'gig' | 'review' | 'payment' | 'talent';

export interface ResourceAuthorizationOptions {
    resourceType: Resources;
    paramName?: string;
    adminCanBypass?: boolean;
}
