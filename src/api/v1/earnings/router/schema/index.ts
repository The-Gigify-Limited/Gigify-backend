import Joi from 'joi';

const uuid = Joi.string().uuid();

export const paymentHistorySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        dateFrom: Joi.string().isoDate().optional(),
        dateTo: Joi.string().isoDate().optional(),
        status: Joi.string().valid('pending', 'processing', 'paid', 'released', 'failed', 'disputed', 'refunded', 'cancelled').optional(),
        direction: Joi.string().valid('incoming', 'outgoing').optional(),
        gigId: uuid.optional(),
    }),
};

export const processPaymentSchema = {
    inputSchema: Joi.object({
        paymentId: uuid.optional(),
        gigId: uuid.optional(),
        applicationId: uuid.optional(),
        talentId: uuid.required(),
        amount: Joi.number().min(0).required(),
        currency: Joi.string().max(8).optional(),
        provider: Joi.string().valid('manual', 'paystack', 'flutterwave', 'stripe').optional(),
        paymentReference: Joi.string().max(120).allow(null, ''),
        platformFee: Joi.number().min(0).optional(),
        status: Joi.string().valid('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled').optional(),
    }),
};

export const createStripeCheckoutSessionSchema = {
    inputSchema: Joi.object({
        paymentId: uuid.optional(),
        gigId: uuid.optional(),
        applicationId: uuid.optional(),
        talentId: uuid.required(),
        amount: Joi.number().min(0).required(),
        currency: Joi.string().max(8).optional(),
        platformFee: Joi.number().min(0).optional(),
        successUrl: Joi.string().uri().allow(null, ''),
        cancelUrl: Joi.string().uri().allow(null, ''),
    }),
};

export const requestPayoutSchema = {
    inputSchema: Joi.object({
        amount: Joi.number().min(0).required(),
        currency: Joi.string().max(8).optional(),
        note: Joi.string().max(500).allow(null, ''),
    }),
};

export const paymentReleaseParamsSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};

export const confirmPaymentReleaseSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        otpCode: Joi.string()
            .pattern(/^\d{6}$/)
            .required(),
    }),
};

const disputeStatusEnum = ['open', 'in_review', 'resolved_talent', 'resolved_employer', 'withdrawn'] as const;

export const openDisputeSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        reason: Joi.string().min(3).max(160).required(),
        description: Joi.string().max(5000).allow(null, '').optional(),
    }),
};

export const listDisputesQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...disputeStatusEnum)
            .optional(),
    }),
};

export const disputeIdParamsSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};

export const addDisputeEvidenceSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        evidenceType: Joi.string().valid('screenshot', 'message', 'document', 'other').required(),
        fileUrl: Joi.string().uri().required(),
        notes: Joi.string().max(2000).allow(null, '').optional(),
    }),
};
