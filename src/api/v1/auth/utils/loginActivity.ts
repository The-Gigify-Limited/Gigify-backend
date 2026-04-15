import type { Request } from 'express';

export type RequestLike = Pick<Request, 'headers' | 'ip'>;

export type LoginActivityContext = {
    device: string;
    location: string;
    time: string;
};

const getHeader = (value: string | string[] | undefined) => {
    if (!value) return '';

    return Array.isArray(value) ? value[0] ?? '' : value;
};

const getIpAddress = (request?: RequestLike | null) => {
    if (!request) return '';

    const forwardedFor = getHeader(request.headers['x-forwarded-for']);
    const flyClientIp = getHeader(request.headers['fly-client-ip']);
    const realIp = getHeader(request.headers['x-real-ip']);
    const requestIp = request.ip ?? '';

    return (
        [flyClientIp, realIp, forwardedFor.split(',')[0]?.trim(), requestIp]
            .map((value) => value?.trim())
            .find(Boolean)
            ?.replace(/^::ffff:/, '') ?? ''
    );
};

const inferBrowser = (userAgent: string) => {
    if (!userAgent) return 'Unknown browser';
    if (/edg\//i.test(userAgent)) return 'Edge';
    if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return 'Safari';
    if (/firefox|fxios/i.test(userAgent)) return 'Firefox';

    return 'Unknown browser';
};

const inferOperatingSystem = (userAgent: string) => {
    if (!userAgent) return 'Unknown OS';
    if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS';
    if (/android/i.test(userAgent)) return 'Android';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';

    return 'Unknown OS';
};

const inferDeviceType = (userAgent: string) => {
    if (!userAgent) return '';
    if (/ipad|tablet/i.test(userAgent)) return 'Tablet';
    if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile';

    return '';
};

const buildLocation = (request?: RequestLike | null) => {
    if (!request) return 'Unavailable';

    const city = getHeader(request.headers['x-vercel-ip-city']);
    const region = getHeader(request.headers['x-vercel-ip-country-region']);
    const country =
        getHeader(request.headers['cf-ipcountry']) || getHeader(request.headers['x-vercel-ip-country']) || getHeader(request.headers['fly-country']);

    const parts = [city, region, country].map((value) => value?.trim()).filter(Boolean);

    if (parts.length > 0) {
        return parts.join(', ');
    }

    const ipAddress = getIpAddress(request);

    return ipAddress ? `IP: ${ipAddress}` : 'Unavailable';
};

export function buildLoginActivityContext(request?: RequestLike | null): LoginActivityContext {
    const userAgent = getHeader(request?.headers['user-agent']).trim();
    const browser = inferBrowser(userAgent);
    const operatingSystem = inferOperatingSystem(userAgent);
    const deviceType = inferDeviceType(userAgent);
    const device = [browser, 'on', operatingSystem, deviceType ? `(${deviceType})` : ''].filter(Boolean).join(' ');
    const location = buildLocation(request);
    const time = `${new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(new Date())} UTC`;

    return {
        device,
        location,
        time,
    };
}
