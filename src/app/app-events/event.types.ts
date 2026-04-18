import { EmployerProfile } from '~/employers/interfaces';
import { Gig, GigApplication, GigReport } from '~/gigs/interfaces';
import { Notification, NotificationChannelEnum, NotificationTypeEnum } from '~/notifications/interfaces';
import { NotificationPreferenceTopic } from '~/notifications/listeners';
import winston from 'winston';
import { Talent, TalentProfile, TalentReview, TalentReviewSummary } from '~/talents/interfaces';
import { Json } from '@/core/types';
import { Activity, User, UserRoleEnum } from '~/user/interfaces';
import { Payment } from '~/earnings/interfaces';
import { AppEventManager } from './app.events';

interface EventDefinition<Data = void, Return = void> {
    data: Data;
    return: Return;
}

export type EventRegister = {
    [K in keyof AppEventsInterface]: AppEventsInterface[K]['data'];
};

export interface AppEventsInterface {
    'app:up': EventDefinition<void, void>;
    'cache:connection:established': EventDefinition<void, winston.Logger>;
    'event:registration:successful': EventDefinition<void, winston.Logger>;
    'event:return-name': EventDefinition<string, string>;
    'user:get-by-id': EventDefinition<{ id: string; fields?: (keyof User)[] }, Partial<User> | null>;
    'user:check-notification-preference': EventDefinition<
        {
            userId: string;
            preferenceKey: NotificationPreferenceTopic;
        },
        boolean
    >;
    'employer:create-profile': EventDefinition<{ user_id: string }, EmployerProfile | null>;
    'employer:get-profile': EventDefinition<{ user_id: string }, EmployerProfile | null>;
    'talent:create-talent': EventDefinition<{ user_id: string }, Talent | null>;
    'talent:get-talent-profile': EventDefinition<{ user_id: string }, TalentProfile | null>;
    'talent:get-reviews': EventDefinition<
        {
            talentId: string;
            page?: number;
            pageSize?: number;
        },
        { reviews: TalentReview[]; summary: TalentReviewSummary[] }
    >;
    'talent:create-review': EventDefinition<
        {
            revieweeId: string;
            reviewerId: string;
            gigId?: string;
            comment?: string;
            rating: number;
        },
        TalentReview | null
    >;
    'gig:get-by-id': EventDefinition<{ gigId: string }, Gig | null>;
    'gig:get-all': EventDefinition<{ query: Record<string, string | number | boolean> }, Gig[]>;
    'gig:update-report-status': EventDefinition<
        {
            reportId: string;
            status: 'open' | 'in_review' | 'resolved' | 'dismissed';
        },
        GigReport
    >;
    'gig:find-application': EventDefinition<
        {
            gigId: string;
            talentId: string;
        },
        GigApplication | null
    >;
    'user:create-activity': EventDefinition<
        {
            userId: string;
            type: string;
            targetId?: string;
            targetType?: string;
            description?: string;
        },
        Activity
    >;
    'user:onboarding-step-completed': EventDefinition<
        {
            userId: string;
            step: 1 | 2 | 3;
            role: UserRoleEnum | null;
        },
        void
    >;
    'earnings:create-record': EventDefinition<
        {
            employerId: string;
            talentId: string;
            gigId: string;
            amount: number;
        },
        Payment
    >;
    'notification:dispatch': EventDefinition<
        {
            userId: string;
            type: NotificationTypeEnum;
            title: string;
            message?: string | null;
            channel?: NotificationChannelEnum;
            payload?: Json;
            preferenceKey?: NotificationPreferenceTopic;
            appEventManager?: AppEventManager;
        },
        Notification | null
    >;
}
