import { BadRequestError, ForbiddenError, TooManyRequestsError } from '@/core';

type SupabaseAuthError = {
    code?: string;
    message?: string;
    status?: number;
};

const e164Pattern = /^\+[1-9]\d{7,14}$/;

export const normalizePhoneNumber = (value: string): string => {
    const normalized = value.trim().replace(/[\s()-]/g, '');

    if (!e164Pattern.test(normalized)) {
        throw new BadRequestError('Phone number must be in international format, for example +2348012345678.');
    }

    return normalized;
};

export const mapSupabasePhoneAuthError = (error: SupabaseAuthError, fallbackMessage = 'Phone authentication failed. Please try again later.'): never => {
    if (error.status === 429 || error.code === 'over_sms_send_rate_limit') {
        throw new TooManyRequestsError('Too many verification requests. Please wait a few minutes before trying again.');
    }

    if (error.status === 400) {
        throw new BadRequestError(error.message ?? 'Unable to process phone authentication right now.');
    }

    throw new ForbiddenError(fallbackMessage);
};
