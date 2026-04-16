import Joi from 'joi';

export const getEmployerParamsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

export const upsertEmployerProfileSchema = {
    inputSchema: Joi.object({
        organizationName: Joi.string().max(120).allow(null),
        companyWebsite: Joi.string().uri().allow(null),
        industry: Joi.string().max(120).allow(null),
    }),
};
