import { ControllerArgs } from '@/core/handlers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { NextFunction, Request, Response } from 'express';
import { Database } from './database.interface';

export interface User extends SupabaseUser {
    role?: string;
}

export type ExpressCallbackFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export type AnyFunction<T = any> = (...args: ControllerArgs<T>[]) => Promise<IHandlerFunctionResponse<T>> | IHandlerFunctionResponse<T>;

export interface IHandlerFunctionResponse<T> {
    code: number;
    message: string;
    data?: T;
    headers?: Record<any, any>;
}

// Authorization
export const user_roles = ['TALENT', 'ADMIN', 'EMPLOYERS'] as const;

export type AuthorizationRoles = (typeof user_roles)[number];

export type DatabaseTable = Database['public']['Tables'];
export type DatabaseEnum = Database['public']['Enums'];
export type TableNames = keyof Database['public']['Tables'];
