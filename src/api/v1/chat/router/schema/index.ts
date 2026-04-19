import Joi from 'joi';

const uuid = Joi.string().uuid();

export const conversationsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        tab: Joi.string().valid('all', 'unread', 'archived').optional(),
    }),
};

export const openConversationSchema = {
    inputSchema: Joi.object({
        participantId: uuid.required(),
        gigId: uuid.optional(),
    }),
};

export const conversationIdSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};

export const sendMessageSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        body: Joi.string().max(5000).allow('', null),
        attachmentUrl: Joi.string().uri().allow(null, ''),
    }).or('body', 'attachmentUrl'),
};

export const blockUserSchema = {
    inputSchema: Joi.object({
        userId: uuid.required(),
        reason: Joi.string().max(500).allow(null, '').optional(),
    }),
};

export const unblockUserSchema = {
    paramsSchema: Joi.object({
        userId: uuid.required(),
    }),
};

export const reportMessageSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        reason: Joi.string().min(3).max(200).required(),
        description: Joi.string().max(2000).allow(null, '').optional(),
    }),
};

export const typingIndicatorSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        typing: Joi.boolean().required(),
    }),
};
