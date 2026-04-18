import type { ControllerArgsTypes } from '@/core';
import { IdentityDocumentTypeEnum, NotificationPreferences, User } from './module.types';

export interface GetUsersQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        role?: 'talent' | 'employer';
        search?: string;
    };
}

export interface GetUserParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    query: {
        full_profile?: boolean;
    };
}

export interface UpdateUserDto {
    params: {
        id: string;
    };
    input: Partial<User>;
}

export interface AdvanceOnboardingStepPayload extends ControllerArgsTypes {
    input: {
        step: 1 | 2 | 3;
        payload: Record<string, unknown>;
    };
}

export interface CreateUserReviewDto extends ControllerArgsTypes {
    input: {
        revieweeId: string;
        gigId?: string;
        comment?: string;
        rating: number;
    };
}

export interface GetUserReviewsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    query: {
        page?: number;
        pageSize?: number;
    };
}

export interface GetUserTimelineDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
    };
}

export interface UpdateNotificationPreferencesDto extends ControllerArgsTypes {
    input: Partial<
        Pick<
            NotificationPreferences,
            'emailEnabled' | 'pushEnabled' | 'smsEnabled' | 'marketingEnabled' | 'gigUpdates' | 'paymentUpdates' | 'messageUpdates' | 'securityAlerts'
        >
    >;
}

export interface SubmitLivenessDto extends ControllerArgsTypes {
    input: {
        idType: IdentityDocumentTypeEnum;
        mediaUrl: string;
        selfieUrl?: string | null;
    };
}

export interface CreateKycSessionDto extends ControllerArgsTypes {
    input: {
        levelName?: string | null;
    };
}
