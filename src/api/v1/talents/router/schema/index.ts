import Joi from 'joi';

const getUsersQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        role: Joi.string().valid('talent', 'employer').optional(),
        search: Joi.string().max(100).optional(),
    }),
};

const getUserParamsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

const updateTalentSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    inputSchema: Joi.object({
        dateOfBirth: Joi.string().min(1).max(60).allow(null),
        stageName: Joi.string().min(1).max(60).allow(null),
        bio: Joi.string().max(30).allow(null),
    }),
};

export { getUserParamsSchema, getUsersQuerySchema, updateTalentSchema };
