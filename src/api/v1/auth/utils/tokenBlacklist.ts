import { cache } from '@/app/app-cache';
import { logger } from '@/core/logging';

const BLACKLIST_PREFIX = 'bl:';

/**
 * Decodes a JWT payload without verifying the signature.
 * We only need the `exp` claim to calculate the TTL for the blacklist entry.
 */
function getTokenExpiry(token: string): number | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
        return decoded.exp ?? null;
    } catch {
        return null;
    }
}

/**
 * Add a token to the blacklist. It auto-expires from Redis
 * when the token itself would have expired (no stale data).
 */
export async function blacklistToken(token: string): Promise<void> {
    const exp = getTokenExpiry(token);
    if (!exp) {
        logger.warn('Could not decode token expiry, blacklisting with default TTL');
        await cache.set(`${BLACKLIST_PREFIX}${token}`, '1', 'EX', 3600);
        return;
    }

    const ttl = exp - Math.floor(Date.now() / 1000);

    if (ttl <= 0) return; // already expired, nothing to blacklist

    await cache.set(`${BLACKLIST_PREFIX}${token}`, '1', 'EX', ttl);

    logger.debug(`Token blacklisted, expires in ${ttl}s`);
}

/**
 * Check if a token has been revoked.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
    return cache.has(`${BLACKLIST_PREFIX}${token}`);
}
