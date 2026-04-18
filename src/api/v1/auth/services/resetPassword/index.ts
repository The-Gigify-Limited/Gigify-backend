import { BadRequestError, BaseService, ControllerArgs, HttpStatus, ServerError, UnAuthorizedError, logger } from '@/core';
import type { IncomingHttpHeaders } from 'http';
import { ResetPasswordPayload } from '../../interface';

const INVALID_SESSION_MESSAGE = 'This password recovery session is invalid or has expired. Please request a new password reset link.';

export class ResetPassword extends BaseService {
    constructor() {
        super();
    }

    handle = async ({ input, headers }: ControllerArgs<ResetPasswordPayload>) => {
        if (!input?.password) {
            throw new BadRequestError('Password is required.');
        }

        const token = extractBearerToken(headers);

        if (!token) {
            throw new UnAuthorizedError(INVALID_SESSION_MESSAGE);
        }

        const { data: userData, error: getUserError } = await this.supabase.auth.getUser(token);

        if (getUserError || !userData?.user) {
            logger.warn('Password reset attempted with invalid or expired recovery token', {
                code: getUserError?.code,
                status: getUserError?.status,
            });

            throw new UnAuthorizedError(INVALID_SESSION_MESSAGE);
        }

        const { error: updateError } = await this.supabase.auth.admin.updateUserById(userData.user.id, {
            password: input.password,
        });

        if (updateError) {
            logger.error('Failed to update password via admin client', {
                userId: userData.user.id,
                code: updateError.code,
                status: updateError.status,
                message: updateError.message,
            });

            throw new ServerError('Unable to update your password right now. Please try again.');
        }

        logger.info('Password reset completed', { userId: userData.user.id });

        return {
            code: HttpStatus.OK,
            message: 'Your password has been reset successfully.',
            data: null,
        };
    };
}

function extractBearerToken(headers: IncomingHttpHeaders | undefined): string | null {
    const header = headers?.authorization;

    if (!header) return null;

    const raw = Array.isArray(header) ? header[0] : header;

    if (!raw) return null;

    const parts = raw.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;

    return parts[1] || null;
}

const resetPassword = new ResetPassword();

export default resetPassword;
