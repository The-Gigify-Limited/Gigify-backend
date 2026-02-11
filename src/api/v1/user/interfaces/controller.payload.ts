import type { ControllerArgsTypes } from '@/core';
import { User } from './module.types';

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
