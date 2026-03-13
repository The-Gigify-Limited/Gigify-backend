import crypto from 'crypto';

export const PAYMENT_RELEASE_OTP_TTL_MINUTES = 10;
export const PAYMENT_RELEASE_OTP_RESEND_COOLDOWN_SECONDS = 90;
export const PAYMENT_RELEASE_OTP_MAX_ATTEMPTS = 5;

export const generatePaymentReleaseOtpCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashPaymentReleaseOtpCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

export const buildPaymentReleaseOtpExpiry = () => new Date(Date.now() + PAYMENT_RELEASE_OTP_TTL_MINUTES * 60 * 1000).toISOString();

export const getPaymentReleaseOtpCooldownRemaining = (lastSentAt: string) =>
    Math.max(PAYMENT_RELEASE_OTP_RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000), 0);
