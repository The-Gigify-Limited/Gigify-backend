import { BadRequestError, ServerError, config } from '@/core';
import axios from 'axios';
import crypto from 'crypto';

type SumsubApplicant = {
    id?: string;
    applicantId?: string;
    externalUserId?: string | null;
    levelName?: string | null;
};

type SumsubSdkTokenResponse = {
    token: string;
    userId?: string | null;
};

const SUMSUB_BASE_URL = 'https://api.sumsub.com';
const SUMSUB_DEFAULT_TOKEN_TTL_SECONDS = 600;

const getSumsubConfig = () => {
    const appToken = config.kyc.sumsub.appToken?.trim();
    const secretKey = config.kyc.sumsub.secretKey?.trim();
    const baseUrl = config.kyc.sumsub.baseUrl?.trim() || SUMSUB_BASE_URL;
    const levelName = config.kyc.sumsub.levelName?.trim() || null;

    if (!appToken || !secretKey) {
        throw new ServerError('Sumsub is not configured. Add SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY to continue.');
    }

    return {
        appToken,
        secretKey,
        baseUrl,
        levelName,
        webhookSecret: config.kyc.sumsub.webhookSecret?.trim() || null,
    };
};

const buildSignature = ({
    body = '',
    method,
    path,
    secretKey,
    timestamp,
}: {
    body?: string;
    method: 'GET' | 'POST';
    path: string;
    secretKey: string;
    timestamp: string;
}) => {
    return crypto.createHmac('sha256', secretKey).update(`${timestamp}${method}${path}${body}`).digest('hex');
};

const buildHeaders = ({
    body = '',
    method,
    path,
}: {
    body?: string;
    method: 'GET' | 'POST';
    path: string;
}) => {
    const sumsubConfig = getSumsubConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-App-Token': sumsubConfig.appToken,
        'X-App-Access-Ts': timestamp,
        'X-App-Access-Sig': buildSignature({
            timestamp,
            method,
            path,
            body,
            secretKey: sumsubConfig.secretKey,
        }),
    };
};

export const getSumsubLevelName = (requestedLevelName?: string | null) => {
    const sumsubConfig = getSumsubConfig();
    const levelName = requestedLevelName?.trim() || sumsubConfig.levelName;

    if (!levelName) {
        throw new ServerError('Sumsub level name is not configured. Add SUMSUB_LEVEL_NAME or pass levelName in the request.');
    }

    return levelName;
};

export const getSumsubApplicantByExternalUserId = async (externalUserId: string) => {
    const sumsubConfig = getSumsubConfig();
    const path = `/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}/one`;

    try {
        const response = await axios.get<SumsubApplicant>(`${sumsubConfig.baseUrl}${path}`, {
            headers: buildHeaders({
                method: 'GET',
                path,
            }),
        });

        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return null;
        }

        throw error;
    }
};

export const createSumsubApplicant = async (input: {
    email?: string | null;
    externalUserId: string;
    firstName?: string | null;
    lastName?: string | null;
    levelName?: string | null;
    phone?: string | null;
}) => {
    const sumsubConfig = getSumsubConfig();
    const levelName = getSumsubLevelName(input.levelName);
    const path = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
    const body = JSON.stringify({
        externalUserId: input.externalUserId,
        email: input.email ?? undefined,
        phone: input.phone ?? undefined,
        fixedInfo: {
            firstName: input.firstName ?? undefined,
            lastName: input.lastName ?? undefined,
        },
    });

    const response = await axios.post<SumsubApplicant>(`${sumsubConfig.baseUrl}${path}`, body, {
        headers: buildHeaders({
            method: 'POST',
            path,
            body,
        }),
    });

    return {
        ...response.data,
        levelName,
    };
};

export const createSumsubSdkAccessToken = async (input: {
    email?: string | null;
    externalUserId: string;
    levelName?: string | null;
    phone?: string | null;
}) => {
    const sumsubConfig = getSumsubConfig();
    const levelName = getSumsubLevelName(input.levelName);
    const path = '/resources/accessTokens/sdk';
    const body = JSON.stringify({
        ttlInSecs: SUMSUB_DEFAULT_TOKEN_TTL_SECONDS,
        userId: input.externalUserId,
        levelName,
        applicantIdentifiers: {
            email: input.email ?? undefined,
            phone: input.phone ?? undefined,
        },
    });

    const response = await axios.post<SumsubSdkTokenResponse>(`${sumsubConfig.baseUrl}${path}`, body, {
        headers: buildHeaders({
            method: 'POST',
            path,
            body,
        }),
    });

    return {
        token: response.data.token,
        userId: response.data.userId ?? input.externalUserId,
        ttlInSecs: SUMSUB_DEFAULT_TOKEN_TTL_SECONDS,
        levelName,
    };
};

export const getSumsubApplicantReviewStatus = async (applicantId: string) => {
    const sumsubConfig = getSumsubConfig();
    const path = `/resources/applicants/${encodeURIComponent(applicantId)}/status`;
    const response = await axios.get<Record<string, any>>(`${sumsubConfig.baseUrl}${path}`, {
        headers: buildHeaders({
            method: 'GET',
            path,
        }),
    });

    return response.data;
};

export const mapSumsubReviewToVerificationStatus = ({
    reviewAnswer,
    reviewStatus,
}: {
    reviewAnswer?: string | null;
    reviewStatus?: string | null;
}) => {
    const normalizedAnswer = reviewAnswer?.toUpperCase();
    const normalizedStatus = reviewStatus?.toLowerCase();

    if (normalizedAnswer === 'GREEN' || normalizedStatus === 'completed') return 'approved';
    if (normalizedAnswer === 'RED' || normalizedStatus === 'rejected' || normalizedStatus === 'failed') return 'rejected';

    return 'pending';
};

export const verifySumsubWebhookSignature = ({
    digestAlgHeader,
    digestHeader,
    rawBody,
}: {
    digestAlgHeader: string | string[] | undefined;
    digestHeader: string | string[] | undefined;
    rawBody: string;
}) => {
    const { webhookSecret } = getSumsubConfig();

    if (!webhookSecret) {
        throw new ServerError('Sumsub webhook verification is not configured. Add SUMSUB_WEBHOOK_SECRET to continue.');
    }

    const digest = Array.isArray(digestHeader) ? digestHeader[0] : digestHeader;
    const digestAlgorithm = (Array.isArray(digestAlgHeader) ? digestAlgHeader[0] : digestAlgHeader) || 'HMAC_SHA256_HEX';

    if (!digest) {
        throw new BadRequestError('Missing Sumsub payload digest header.');
    }

    const normalizedAlgorithm = digestAlgorithm.toUpperCase();
    const algorithm = normalizedAlgorithm.includes('SHA1') ? 'sha1' : 'sha256';
    const expectedDigest = crypto.createHmac(algorithm, webhookSecret).update(rawBody).digest('hex');

    if (!secureCompareHex(digest, expectedDigest)) {
        throw new BadRequestError('Invalid Sumsub webhook signature.');
    }
};

const secureCompareHex = (left: string, right: string) => {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
