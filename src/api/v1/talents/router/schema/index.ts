import Joi from 'joi';

const uuid = Joi.string().uuid();

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
        id: uuid.required(),
    }),
};

const updateTalentSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    inputSchema: Joi.object({
        bannerUrl: Joi.string().uri().allow(null),
        biography: Joi.string().max(1000).allow(null),
        dateOfBirth: Joi.string().isoDate().allow(null),
        maxRate: Joi.number().min(0).allow(null),
        minRate: Joi.number().min(0).optional(),
        primaryRole: Joi.string().max(80).allow(null),
        rateCurrency: Joi.string().max(8).optional(),
        skills: Joi.array().items(Joi.string().max(80)).allow(null),
        stageName: Joi.string().min(1).max(60).allow(null),
        yearsExperience: Joi.number().integer().min(0).allow(null),
    }),
};

const talentPortfolioParamSchema = {
    paramsSchema: Joi.object({
        talentPortfolioId: uuid.required(),
    }),
};

const createTalentReviewSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        gigId: uuid.optional(),
        comment: Joi.string().max(1000).allow(null, ''),
        rating: Joi.number().min(1).max(5).required(),
    }),
};

const talentReviewsQuerySchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

export {
    createTalentReviewSchema,
    getUserParamsSchema,
    getUsersQuerySchema,
    talentPortfolioParamSchema,
    talentReviewsQuerySchema,
    updateTalentSchema,
};
