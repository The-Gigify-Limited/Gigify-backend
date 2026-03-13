import rateLimit from 'express-rate-limit';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const globalRateLimiter = rateLimit({
    windowMs: 12 * HOUR,
    max: 400,
    message: 'You have exceeded the allowed request limit for this period.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
    windowMs: 15 * MINUTE,
    max: 5,
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
    windowMs: HOUR,
    max: 3,
    message: 'Too many password reset requests. Please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const paymentReleaseOtpRateLimiter = rateLimit({
    windowMs: HOUR,
    max: 5,
    message: 'Too many payment release verification requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
