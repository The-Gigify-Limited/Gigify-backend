import { BadRequestError, ConflictError, ForbiddenError, TooManyRequestsError, UnAuthorizedError } from '@/core';

type SupabaseError = {
    message?: string;
    status?: number;
    code?: string;
};

export function mapSupabaseAuthError(error: SupabaseError, fallBackMessage?: string): never {
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        throw new TooManyRequestsError('Too many signup attempts. Please wait a few minutes before trying again.');
    }

    if (error.message === 'Email not confirmed') {
        throw new UnAuthorizedError('Please verify your email before logging in.');
    }

    if (error.status === 400) {
        throw new BadRequestError(error.message || 'Invalid request');
    }

    if (error.status === 409) {
        throw new ConflictError('User already exists');
    }

    if (error.status === 401) {
        throw new UnAuthorizedError('Invalid email or password');
    }
    

    throw new ForbiddenError(fallBackMessage ?? 'Authentication failed');
}
