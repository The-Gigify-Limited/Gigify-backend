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
        bankName: Joi.string().max(120).allow(null, ''),
        accountNumber: Joi.string().max(40).allow(null, ''),
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

const browseTalentsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(50).default(20),
        search: Joi.string().max(100).optional(),
        primaryRole: Joi.string().max(80).optional(),
        genres: Joi.array().items(Joi.string().max(80)).single().optional(),
        minRate: Joi.number().min(0).optional(),
        maxRate: Joi.number().min(0).optional(),
        rateCurrency: Joi.string().max(8).optional(),
        minRating: Joi.number().min(0).max(5).optional(),
        location: Joi.string().max(120).optional(),
        locationCity: Joi.string().max(120).optional(),
        locationCountry: Joi.string().max(120).optional(),
        radiusKm: Joi.number().min(1).max(500).optional(),
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional(),
        availableOn: Joi.date().iso().optional(),
        sortBy: Joi.string().valid('rating', 'priceAsc', 'priceDesc', 'recent').default('rating'),
    }),
};

const savedTalentsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

const availabilityListSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    querySchema: Joi.object({
        from: Joi.date().iso().optional(),
        to: Joi.date().iso().optional(),
    }),
};

const availabilityCreateSchema = {
    inputSchema: Joi.object({
        unavailableFrom: Joi.date().iso().required(),
        unavailableUntil: Joi.date().iso().required(),
        reason: Joi.string().max(200).allow('', null).optional(),
    }),
};

const availabilityDeleteSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};

export {
    availabilityCreateSchema,
    availabilityDeleteSchema,
    availabilityListSchema,
    browseTalentsQuerySchema,
    createTalentReviewSchema,
    getUserParamsSchema,
    getUsersQuerySchema,
    savedTalentsQuerySchema,
    talentPortfolioParamSchema,
    talentReviewsQuerySchema,
    updateTalentSchema,
};
