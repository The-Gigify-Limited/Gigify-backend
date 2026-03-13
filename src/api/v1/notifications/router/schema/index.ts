import Joi from 'joi';

const uuid = Joi.string().uuid();

export const notificationsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        isRead: Joi.boolean().optional(),
    }),
};

export const notificationIdSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};
