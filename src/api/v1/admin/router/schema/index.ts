import Joi from 'joi';

const uuid = Joi.string().uuid();

export const adminUsersQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        role: Joi.string().valid('talent', 'employer', 'admin').optional(),
        status: Joi.string().valid('active', 'suspended').optional(),
        search: Joi.string().max(120).optional(),
    }),
};

export const adminUserStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('active', 'suspended').required(),
    }),
};

export const adminReportsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('open', 'in_review', 'resolved', 'dismissed').optional(),
    }),
};

export const adminReportStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('open', 'in_review', 'resolved', 'dismissed').required(),
        resolutionNote: Joi.string().max(2000).allow(null, ''),
    }),
};

export const adminPayoutRequestsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('requested', 'approved', 'paid', 'rejected').optional(),
    }),
};

export const adminPayoutRequestStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('requested', 'approved', 'paid', 'rejected').required(),
    }),
};

export const adminIdentityVerificationQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    }),
};

export const adminIdentityVerificationStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('pending', 'approved', 'rejected').required(),
        notes: Joi.string().max(1000).allow(null, ''),
    }),
};

export const adminAuditLogsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        userId: uuid.optional(),
        result: Joi.string().valid('success', 'failure').optional(),
        resourceType: Joi.string().max(80).optional(),
        action: Joi.string().max(120).optional(),
    }),
};

export const adminBroadcastNotificationSchema = {
    inputSchema: Joi.object({
        role: Joi.string().valid('talent', 'employer', 'admin').optional(),
        status: Joi.string().valid('active', 'suspended').optional(),
        title: Joi.string().min(3).max(140).required(),
        message: Joi.string().min(3).max(2000).required(),
        type: Joi.string().valid('gig_update', 'application_update', 'payment_update', 'message_received', 'security_alert', 'marketing').optional(),
        channel: Joi.string().valid('in_app', 'email', 'push', 'sms').optional(),
    }),
};

export const adminGigsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired').optional(),
        employerId: uuid.optional(),
        search: Joi.string().max(120).optional(),
    }),
};

export const adminGigStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired').required(),
    }),
};

const adminDisputeStatusEnum = ['open', 'in_review', 'resolved_talent', 'resolved_employer', 'withdrawn'] as const;

export const adminDisputesQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...adminDisputeStatusEnum)
            .optional(),
    }),
};

export const adminResolveDisputeSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        resolution: Joi.string().valid('resolved_talent', 'resolved_employer', 'withdrawn').required(),
        adminNotes: Joi.string().max(5000).allow(null, '').optional(),
    }),
};
