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
        locationLatitude: Joi.number().min(-90).max(90).allow(null),
        locationLongitude: Joi.number().min(-180).max(180).allow(null),
        fullAddress: Joi.string().max(255).allow(null),
        postCode: Joi.number().integer().min(0).allow(null),
        profileImageUrl: Joi.string().uri().allow(null, ''),
        gender: Joi.string().valid('male', 'female', 'non_binary', 'prefer_not_to_say').allow(null),
        username: Joi.string().alphanum().min(3).max(32).allow(null),
        onboardingStep: Joi.number().integer().min(0).allow(null),
    }),
};

const createUserReviewSchema = {
    inputSchema: Joi.object({
        revieweeId: Joi.string().uuid().required(),
        gigId: Joi.string().uuid().optional(),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().max(1000).allow(null, ''),
    }),
};

const userReviewsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

const timelineQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

const livenessSchema = {
    inputSchema: Joi.object({
        mediaUrl: Joi.string().uri().required(),
        selfieUrl: Joi.string().uri().allow(null, ''),
        idType: Joi.string().valid('passport', 'drivers_license', 'national_id', 'selfie_video').required(),
    }),
};

const kycSessionSchema = {
    inputSchema: Joi.object({
        levelName: Joi.string().max(120).allow(null, ''),
    }),
};

const notificationPreferencesSchema = {
    inputSchema: Joi.object({
        emailEnabled: Joi.boolean().optional(),
        pushEnabled: Joi.boolean().optional(),
        smsEnabled: Joi.boolean().optional(),
        marketingEnabled: Joi.boolean().optional(),
        gigUpdates: Joi.boolean().optional(),
        paymentUpdates: Joi.boolean().optional(),
        messageUpdates: Joi.boolean().optional(),
        securityAlerts: Joi.boolean().optional(),
    }),
};

export {
    createUserReviewSchema,
    getUserParamsSchema,
    getUsersQuerySchema,
    kycSessionSchema,
    livenessSchema,
    notificationPreferencesSchema,
    timelineQuerySchema,
    updateUserSchema,
    userReviewsSchema,
};
