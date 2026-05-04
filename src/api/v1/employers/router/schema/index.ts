import Joi from 'joi';

const gigStatusEnum = ['draft', 'open', 'in_progress', 'completed', 'cancelled'] as const;

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

export const getEmployerGigsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...gigStatusEnum)
            .optional(),
        serviceId: Joi.string().uuid().optional(),
        search: Joi.string().max(120).optional(),
        location: Joi.string().max(120).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        radiusKm: Joi.number().min(1).max(500).optional(),
        minBudget: Joi.number().min(0).optional(),
        maxBudget: Joi.number().min(0).optional(),
        dateFrom: Joi.string().isoDate().optional(),
        dateTo: Joi.string().isoDate().optional(),
        isRemote: Joi.boolean().optional(),
        eventType: Joi.string().max(120).optional(),
        genres: Joi.array().items(Joi.string().max(80)).optional(),
    }),
};
