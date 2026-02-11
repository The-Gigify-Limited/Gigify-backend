import { dispatch } from '@/app';
import { BadRequestError, ForbiddenError, UnAuthorizedError, UnProcessableError, joiValidate, supabaseAdmin } from '@/core';
import type { FileObject, FileObjects } from '@/core/types';
import type { Request } from 'express';
import type { FileArray } from 'express-fileupload';
import { checkPermissions, verifyResourceOwnership } from '~/auth/utils';
import { UserRoleEnum } from '~/user/interfaces';
import { ControllerArgsTypes, ControllerHandlerOptions, ValidationSchema } from './index.interface';

export const parseIncomingRequest = (req: Request): ControllerArgsTypes => {
    return {
        input: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
        user: req.user,
        files: parseFileContents(req.files),
        request: req,
    };
};

const parseFileContents = (files: FileArray | null | undefined): FileObjects | null => {
    if (!files) return null;

    const fileObjects: FileObjects = {};

    for (const key in files) {
        const file = files[key] as FileObject;

        fileObjects[key] = file;
    }

    return fileObjects;
};

/**
 * Validate the request data against the provided schema.
 * @param {ValidationSchema} schema The schema definitions for query, params, and input.
 * @param {ParsedRequestContext} controllerArgs The parsed controller arguments.
 * @private
 */
export const validateIncomingRequest = (schema: ValidationSchema, controllerArgs: ControllerArgsTypes) => {
    const { querySchema, paramsSchema, inputSchema } = schema;

    const { input, params, query } = controllerArgs;

    try {
        if (inputSchema) joiValidate(inputSchema, input);
        if (querySchema) joiValidate(querySchema, query);
        if (paramsSchema) joiValidate(paramsSchema, params);
    } catch (error: any) {
        throw new UnProcessableError(error.message.replaceAll('"', ''));
    }
};

export const handlePrivateRequest = async (req: Request, options: ControllerHandlerOptions) => {
    let user = req.user;

    if (!user) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnAuthorizedError('Authorization header missing or invalid');
        }

        const token = authHeader.split(' ')[1];

        const {
            data: { user: supabaseUser },
        } = await supabaseAdmin.auth.getUser(token);

        if (!supabaseUser) {
            throw new UnAuthorizedError('Invalid or expired token');
        }

        const [dbUser] = await dispatch('user:get-by-id', { id: supabaseUser.id });
        if (!dbUser) throw new UnAuthorizedError('Profile not found');

        req.user = dbUser;
        user = dbUser;
    }

    if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!user.role) throw new UnAuthorizedError('User role missing');

        const isRequestAuthorized = options.allowedRoles?.includes(user.role.toLocaleUpperCase() as UserRoleEnum);

        if (!isRequestAuthorized) throw new ForbiddenError('You do not have access to the requested resource');
    }

    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        await checkPermissions(user.id!, options.requiredPermissions);
    }

    if (options.checkResourceOwnership) {
        const { resourceType, adminCanBypass = true, paramName = 'id' } = options.checkResourceOwnership;

        const resourceId = req.params[paramName];

        if (!resourceId) {
            throw new BadRequestError(`Resource ID not found in request parameters: ${paramName}`);
        }

        if (!user.id) {
            throw new BadRequestError('User ID not found in request parameters');
        }

        await verifyResourceOwnership(user, resourceType, resourceId, adminCanBypass);
    }
};
