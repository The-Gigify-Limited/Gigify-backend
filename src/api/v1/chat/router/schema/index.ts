import Joi from 'joi';

const uuid = Joi.string().uuid();

export const conversationsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
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
