import { ControllerArgs } from '@/core/handlers';
import type { NextFunction, Request, Response } from 'express';

export type ITokenSignedPayload = {
    id: string;
};

export type ExpressCallbackFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export type AnyFunction<T = any> = (...args: ControllerArgs<T>[]) => Promise<IHandlerFunctionResponse<T>> | IHandlerFunctionResponse<T>;

export interface IHandlerFunctionResponse<T> {
    code: number;
    message: string;
    data?: T;
    headers?: Record<any, any>;
}

// Authorization
export const user_roles = ['FARMER', 'ADMIN', 'USER', 'DEVELOPER'] as const;

export type AuthorizationRoles = typeof user_roles[number];
