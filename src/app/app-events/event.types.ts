import { EmployerProfile } from '~/employers/interfaces';
import { Gig } from '~/gigs/interfaces';
import { Notification, NotificationChannelEnum, NotificationTypeEnum } from '~/notifications/interfaces';
import { NotificationPreferenceTopic } from '~/notifications/listeners';
import winston from 'winston';
import { Talent, TalentProfile } from '~/talents/interfaces';
import { Json } from '@/core/types';
import { User } from '~/user/interfaces';

interface EventDefinition<Data = any, Return = any> {
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
        { reviews: any[]; summary: any }
    >;
    'talent:create-review': EventDefinition<
        {
            revieweeId: string;
            reviewerId: string;
            gigId?: string;
            comment?: string;
            rating: number;
        },
        any
    >;
    'gig:get-by-id': EventDefinition<{ gigId: string }, Gig | null>;
    'gig:get-all': EventDefinition<{ query: Record<string, any> }, Gig[]>;
    'gig:update-report-status': EventDefinition<
        {
            reportId: string;
            status: 'open' | 'in_review' | 'resolved' | 'dismissed';
        },
        any
    >;
    'gig:find-application': EventDefinition<
        {
            gigId: string;
            talentId: string;
        },
        any | null
    >;
    'user:create-activity': EventDefinition<
        {
            userId: string;
            type: string;
            targetId?: string;
            targetType?: string;
            description?: string;
        },
        any
    >;
    'earnings:create-record': EventDefinition<
        {
            employerId: string;
            talentId: string;
            gigId: string;
            amount: number;
        },
        any
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
            appEventManager?: any;
        },
        Notification | null
    >;
}
