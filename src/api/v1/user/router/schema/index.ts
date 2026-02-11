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
    querySchema: Joi.object({
        full_profile: Joi.boolean().optional(),
    }),
};

const updateUserSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    inputSchema: Joi.object({
        firstName: Joi.string().min(1).max(60).allow(null),
        lastName: Joi.string().min(1).max(60).allow(null),
        phoneNumber: Joi.string().max(30).allow(null),
        locationCountry: Joi.string().max(80).allow(null),
        locationCity: Joi.string().max(80).allow(null),
        profileImageUrl: Joi.string().uri().allow(null),
        gender: Joi.string().valid('male', 'female').allow(null),
    }),
};

export { getUserParamsSchema, getUsersQuerySchema, updateUserSchema };
