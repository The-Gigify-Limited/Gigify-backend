import { AuthorizationRoles, FileObjects, ITokenSignedPayload } from '@/core/types';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';
import { Schema } from 'joi';

// Controller Handler Callback Function Arguments
type ExtractPayloadKeys<T> = {
    [K in keyof T]: K extends keyof ControllerArgsTypes ? K : never;
}[keyof T];

type ExtractControllerArgsPayloadKeys<T> = Pick<T, ExtractPayloadKeys<T>>;

export type ControllerArgsTypes = Partial<{
    params: Record<string, any>;
    query: Record<string, any>;
    input: Record<string, any>;
    user: ITokenSignedPayload | undefined | null;
    files: FileObjects | null;
}> & {
    headers: IncomingHttpHeaders;
    request: Request;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ControllerArgs<T = {}> = ControllerArgsTypes & T & ExtractControllerArgsPayloadKeys<T>;

// Controller Handler Validation
export interface ValidationSchema {
    inputSchema?: Schema;
    paramsSchema?: Schema;
    querySchema?: Schema;
    fileSchema?: Schema;
}

// Controller Handler Options
export type ControllerHandlerOptions = {
    isPrivate: boolean;

    allowedRoles?: AuthorizationRoles[];
};
