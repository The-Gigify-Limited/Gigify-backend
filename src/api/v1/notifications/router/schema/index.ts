import Joi from 'joi';

const uuid = Joi.string().uuid();

export const notificationsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        isRead: Joi.boolean().optional(),
        type: Joi.string().valid('gig_update', 'application_update', 'payment_update', 'message_received', 'security_alert', 'marketing').optional(),
    }),
};

export const notificationIdSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};
