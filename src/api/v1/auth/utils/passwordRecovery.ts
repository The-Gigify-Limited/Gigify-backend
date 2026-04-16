import { BadRequestError, ServerError, TooManyRequestsError, type SupabaseClient } from '@/core';

type SupabaseAuthError = {
    code?: string;
    message?: string;
    status?: number;
};

export const PASSWORD_RESET_REQUEST_MESSAGE = 'If an account with that email exists, we will email password reset instructions shortly.';

export type PasswordRecoveryLink = {
    actionLink: string;
    emailOtp: string | null;
};

export async function generatePasswordRecoveryLink({ supabase, email }: { supabase: SupabaseClient; email: string }): Promise<PasswordRecoveryLink> {
    const redirectTo = process.env.PASSWORD_RESET_REDIRECT_URL?.trim() || undefined;

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) throw error;

    const actionLink = data.properties?.action_link;

    if (!actionLink) {
        throw new ServerError('Supabase did not return a usable password recovery link.');
    }

    return {
        actionLink,
        emailOtp: data.properties?.email_otp ?? null,
    };
}

export function mapSupabaseRecoveryError(error: SupabaseAuthError): never {
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        throw new TooManyRequestsError('Too many password reset requests. Please wait a few minutes before trying again.');
    }

    if (error.status === 400) {
        throw new BadRequestError(error.message ?? 'Unable to process the password reset request.');
    }

    throw new ServerError('Unable to process the password reset request right now. Please try again later.');
}

export function resolveUserDisplayName(firstName: string | null | undefined, email: string): string {
    const normalizedFirstName = firstName?.trim();

    if (normalizedFirstName) {
        return normalizedFirstName;
    }

    const localPart = email.split('@')[0]?.trim();

    if (!localPart) return 'there';

    return localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
        .join(' ');
}
