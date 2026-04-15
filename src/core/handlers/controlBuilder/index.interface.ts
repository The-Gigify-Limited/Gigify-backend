import { FileObjects } from '@/core/types';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';
import { Schema } from 'joi';
import { Permission, ResourceAuthorizationOptions } from '~/auth/interface';
import { User, UserRoleEnum } from '~/user/interfaces';

type ExtractPayloadKeys<T> = {
    [K in keyof T]: K extends keyof ControllerArgsTypes ? K : never;
}[keyof T];

type ExtractControllerArgsPayloadKeys<T> = Pick<T, ExtractPayloadKeys<T>>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ControllerArgsTypes = Partial<{
    params: Record<string, string>;
    query: Record<string, any>;
    input: Record<string, any>;
    user: Partial<User> | undefined | null;
    files: FileObjects | null;
}> & /* eslint-enable @typescript-eslint/no-explicit-any */ {
    headers: IncomingHttpHeaders;
    request: Request;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ControllerArgs<T = {}> = ControllerArgsTypes & T & ExtractControllerArgsPayloadKeys<T>;

export interface ValidationSchema {
    inputSchema?: Schema;
    paramsSchema?: Schema;
    querySchema?: Schema;
    fileSchema?: Schema;
}

export type ControllerHandlerOptions = {
    isPrivate: boolean;
    allowedRoles?: UserRoleEnum[];
    requiredPermissions?: Permission[];
    checkResourceOwnership?: ResourceAuthorizationOptions;
};
