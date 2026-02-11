import winston from 'winston';
import { Talent, TalentProfile } from '~/talents/interfaces';
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

    // TALENTS
    'talent:create-talent': EventDefinition<{ user_id: string }, Talent | null>;
    'talent:get-talent-profile': EventDefinition<{ user_id: string }, TalentProfile | null>;
}
