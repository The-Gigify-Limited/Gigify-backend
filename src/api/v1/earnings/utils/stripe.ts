import { BadRequestError, ServerError, config } from '@/core';
import { Json } from '@/core/types';
import axios from 'axios';
import crypto from 'crypto';

const STRIPE_API_BASE_URL = 'https://api.stripe.com/v1';
const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;
const ZERO_DECIMAL_CURRENCIES = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

type StripeCheckoutSessionResponse = {
    id: string;
    url: string | null;
    expires_at?: number | null;
    payment_intent?: string | null;
    payment_status?: string | null;
    customer_email?: string | null;
};

type CreateStripeCheckoutSessionInput = {
    amount: number;
    cancelUrl?: string | null;
    currency?: string | null;
    customerEmail?: string | null;
    employerId: string;
    paymentId: string;
    productDescription?: string | null;
    productName?: string | null;
    successUrl?: string | null;
    talentId: string;
};

const getStripeConfig = () => {
    const secretKey = config.payments.stripe.secretKey?.trim();

    if (!secretKey) {
        throw new ServerError('Stripe is not configured. Add STRIPE_SECRET_KEY to continue.');
    }

    return {
        secretKey,
        webhookSecret: config.payments.stripe.webhookSecret?.trim() || null,
        checkoutSuccessUrl: config.payments.stripe.checkoutSuccessUrl?.trim() || null,
        checkoutCancelUrl: config.payments.stripe.checkoutCancelUrl?.trim() || null,
    };
};

const mergeMetadata = (current: Json | null | undefined, next: Record<string, unknown>) => {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};

    return {
        ...(base as Record<string, unknown>),
        ...next,
    } as Json;
};

const setParam = (params: URLSearchParams, key: string, value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === '') return;

    params.set(key, String(value));
};

export const mergeStripeMetadata = mergeMetadata;

export const toStripeMinorAmount = (amount: number, currency?: string | null) => {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestError('Stripe payment amount must be greater than zero.');
    }

    const normalizedCurrency = (currency ?? 'NGN').toUpperCase();
    const multiplier = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency) ? 1 : 100;

    return Math.round(amount * multiplier);
};

export const createStripeCheckoutSession = async (input: CreateStripeCheckoutSessionInput) => {
    const stripeConfig = getStripeConfig();
    const successUrl = input.successUrl?.trim() || stripeConfig.checkoutSuccessUrl;
    const cancelUrl = input.cancelUrl?.trim() || stripeConfig.checkoutCancelUrl;

    if (!successUrl || !cancelUrl) {
        throw new ServerError('Stripe checkout redirect URLs are not configured. Add STRIPE_CHECKOUT_SUCCESS_URL and STRIPE_CHECKOUT_CANCEL_URL.');
    }

    const currency = (input.currency ?? 'NGN').toLowerCase();
    const params = new URLSearchParams();

    setParam(params, 'mode', 'payment');
    setParam(params, 'success_url', successUrl);
    setParam(params, 'cancel_url', cancelUrl);
    setParam(params, 'client_reference_id', input.paymentId);
    setParam(params, 'customer_email', input.customerEmail ?? null);
    setParam(params, 'metadata[paymentId]', input.paymentId);
    setParam(params, 'metadata[employerId]', input.employerId);
    setParam(params, 'metadata[talentId]', input.talentId);
    setParam(params, 'payment_intent_data[metadata][paymentId]', input.paymentId);
    setParam(params, 'payment_intent_data[metadata][employerId]', input.employerId);
    setParam(params, 'payment_intent_data[metadata][talentId]', input.talentId);
    setParam(params, 'line_items[0][quantity]', 1);
    setParam(params, 'line_items[0][price_data][currency]', currency);
    setParam(params, 'line_items[0][price_data][unit_amount]', toStripeMinorAmount(input.amount, input.currency));
    setParam(params, 'line_items[0][price_data][product_data][name]', input.productName ?? 'Gigify escrow funding');
    setParam(params, 'line_items[0][price_data][product_data][description]', input.productDescription ?? 'Secure escrow funding for a Gigify booking.');

    const response = await axios.post<StripeCheckoutSessionResponse>(`${STRIPE_API_BASE_URL}/checkout/sessions`, params, {
        headers: {
            Authorization: `Bearer ${stripeConfig.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
};

export const verifyStripeWebhookSignature = ({
    rawBody,
    signatureHeader,
}: {
    rawBody: string;
    signatureHeader: string | string[] | undefined;
}) => {
    const { webhookSecret } = getStripeConfig();

    if (!webhookSecret) {
        throw new ServerError('Stripe webhook verification is not configured. Add STRIPE_WEBHOOK_SECRET to continue.');
    }

    const headerValue = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!headerValue) {
        throw new BadRequestError('Missing Stripe signature header.');
    }

    const parts = headerValue.split(',').reduce<Record<string, string[]>>((acc, item) => {
        const [key, value] = item.split('=');

        if (key && value) {
            acc[key] = acc[key] ? [...acc[key], value] : [value];
        }

        return acc;
    }, {});

    const timestamp = parts.t?.[0];
    const signatures = parts.v1 ?? [];

    if (!timestamp || signatures.length === 0) {
        throw new BadRequestError('Malformed Stripe signature header.');
    }

    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    const isValid = signatures.some((signature) => secureCompareHex(signature, expectedSignature));

    if (!isValid) {
        throw new BadRequestError('Invalid Stripe webhook signature.');
    }

    const timestampAgeSeconds = Math.abs(Date.now() - Number(timestamp) * 1000) / 1000;

    if (timestampAgeSeconds > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
        throw new BadRequestError('Stripe webhook signature timestamp is outside the accepted tolerance.');
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
