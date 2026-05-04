import Joi from 'joi';

const uuid = Joi.string().uuid();
const statusEnum = ['draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired'] as const;
const applicationStatusEnum = ['submitted', 'reviewing', 'shortlisted', 'hired', 'rejected', 'withdrawn'] as const;
const timeOfDayPattern = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const timeOfDay = Joi.string().pattern(timeOfDayPattern, 'HH:MM or HH:MM:SS');

export const gigFiltersSchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...statusEnum)
            .optional(),
        serviceId: uuid.optional(),
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
        employerId: uuid.optional(),
        gigTypeId: uuid.optional(),
        skillRequired: Joi.string().max(160).optional(),
        genres: Joi.array().items(Joi.string().max(80)).single().optional(),
    }),
};
// Reusable array of free-form skill labels, accepts a single string and
// coerces it to a one-element array so existing FE call sites that send
// `skillRequired: "DJ"` keep working alongside the new `["DJ", "Drummer"]`
// shape.
const skillsArray = Joi.array().items(Joi.string().min(1).max(160)).max(20).single();

export const discoveryFeedSchema = {
    querySchema: Joi.object({
        limit: Joi.number().integer().min(1).max(12).optional(),
        pageSize: Joi.number().integer().min(1).max(12).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        radiusKm: Joi.number().min(1).max(500).optional(),
    }),
};

export const createGigSchema = {
    inputSchema: Joi.object({
        title: Joi.string().min(3).max(140).required(),
        description: Joi.string().max(5000).allow(null, ''),
        budgetAmount: Joi.number().min(0).required(),
        currency: Joi.string().max(8).optional(),
        gigDate: Joi.string().isoDate().required(),
        serviceId: uuid.allow(null),
        isRemote: Joi.boolean().default(false),
        requiredTalentCount: Joi.number().integer().min(1).max(25).default(1),
        locationLatitude: Joi.number().min(-90).max(90).allow(null),
        locationLongitude: Joi.number().min(-180).max(180).allow(null),
        venueName: Joi.when('isRemote', {
            is: true,
            then: Joi.string().max(160).allow(null, ''),
            otherwise: Joi.string().max(160).required(),
        }),
        // Fields aligned with the FE's CreateGigPayload (server/apiTypes/gig.type.ts).
        displayImage: Joi.string().uri().allow(null, '').optional(),
        // Required: the canonical gig type, identified by its uuid from
        // GET /gig/types. The FE renders the dropdown from that list.
        gigTypeId: uuid.required(),
        gigStartTime: timeOfDay.allow(null, '').optional(),
        gigEndTime: timeOfDay.allow(null, '').optional(),
        gigLocation: Joi.string().max(160).allow(null, '').optional(),
        gigAddress: Joi.string().max(240).allow(null, '').optional(),
        gigPostCode: Joi.string().max(20).allow(null, '').optional(),
        isEquipmentRequired: Joi.boolean().allow(null).optional(),
        skillRequired: skillsArray.allow(null).optional(),
        durationMinutes: Joi.number().integer().min(0).max(10_000).allow(null).optional(),
        dressCode: Joi.string().max(120).allow(null, '').optional(),
        additionalNotes: Joi.string().max(2000).allow(null, '').optional(),
    }),
};

export const updateGigSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        title: Joi.string().min(3).max(140).optional(),
        description: Joi.string().max(5000).allow(null, '').optional(),
        budgetAmount: Joi.number().min(0).optional(),
        currency: Joi.string().max(8).optional(),
        gigDate: Joi.string().isoDate().optional(),
        serviceId: uuid.allow(null).optional(),
        isRemote: Joi.boolean().optional(),
        locationLatitude: Joi.number().min(-90).max(90).allow(null).optional(),
        locationLongitude: Joi.number().min(-180).max(180).allow(null).optional(),
        venueName: Joi.string().max(160).allow(null, '').optional(),
        requiredTalentCount: Joi.number().integer().min(1).max(25).optional(),
        status: Joi.string()
            .valid(...statusEnum)
            .optional(),
        displayImage: Joi.string().uri().allow(null, '').optional(),
        gigTypeId: uuid.optional(),
        gigStartTime: timeOfDay.allow(null, '').optional(),
        gigEndTime: timeOfDay.allow(null, '').optional(),
        gigLocation: Joi.string().max(160).allow(null, '').optional(),
        gigAddress: Joi.string().max(240).allow(null, '').optional(),
        gigPostCode: Joi.string().max(20).allow(null, '').optional(),
        isEquipmentRequired: Joi.boolean().allow(null).optional(),
        skillRequired: skillsArray.allow(null).optional(),
        durationMinutes: Joi.number().integer().min(0).max(10_000).allow(null).optional(),
        dressCode: Joi.string().max(120).allow(null, '').optional(),
        additionalNotes: Joi.string().max(2000).allow(null, '').optional(),
    }),
};

export const gigIdSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
};

export const applyToGigSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        proposalMessage: Joi.string().max(1000).allow(null, ''),
        proposedRate: Joi.number().min(0).optional(),
        proposedCurrency: Joi.string().max(8).allow(null, '').optional(),
    }),
};

export const gigApplicationsSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...applicationStatusEnum)
            .optional(),
    }),
};

export const updateApplicationStatusSchema = {
    paramsSchema: Joi.object({
        gigId: uuid.required(),
        applicationId: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string().valid('shortlisted', 'rejected').required(),
        employerNotes: Joi.string().max(2000).allow(null, '').optional(),
    }),
};

export const updateGigStatusSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string()
            .valid(...statusEnum)
            .required(),
        reason: Joi.string().max(300).allow(null, ''),
    }),
};

export const hireTalentSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
        talentId: uuid.required(),
    }),
    inputSchema: Joi.object({
        amount: Joi.number().min(0).optional(),
        currency: Joi.string().max(8).optional(),
        provider: Joi.string().valid('manual', 'paystack', 'flutterwave', 'stripe').optional(),
        paymentReference: Joi.string().max(120).allow(null, ''),
        platformFee: Joi.number().min(0).optional(),
    }),
};

export const myGigsSchema = {
    paramsSchema: Joi.object({
        status: Joi.string().valid('applied', 'upcoming', 'active', 'completed').required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

export const savedGigsSchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
    }),
};

export const reportTalentSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        talentId: uuid.required(),
        category: Joi.string().max(80).allow(null, ''),
        reason: Joi.string().min(10).max(2000).required(),
    }),
};

const offerStatusEnum = ['pending', 'accepted', 'declined', 'withdrawn', 'expired', 'countered'] as const;
const offerMutableStatusEnum = ['accepted', 'declined', 'withdrawn', 'countered'] as const;

export const createGigOfferSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    inputSchema: Joi.object({
        talentId: uuid.required(),
        message: Joi.string().max(2000).allow(null, ''),
        proposedRate: Joi.number().min(0).allow(null),
        currency: Joi.string().max(8).allow(null, ''),
        expiresAt: Joi.string().isoDate().allow(null, ''),
    }),
};

export const gigOffersSchema = {
    paramsSchema: Joi.object({
        id: uuid.required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid(...offerStatusEnum)
            .optional(),
    }),
};

export const myGigOffersSchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        direction: Joi.string().valid('received', 'sent', 'all').optional(),
        status: Joi.string()
            .valid(...offerStatusEnum)
            .optional(),
    }),
};

export const updateGigOfferSchema = {
    paramsSchema: Joi.object({
        offerId: uuid.required(),
    }),
    inputSchema: Joi.object({
        status: Joi.string()
            .valid(...offerMutableStatusEnum)
            .required(),
        counterAmount: Joi.when('status', {
            is: 'countered',
            then: Joi.number().min(0).required(),
            otherwise: Joi.forbidden(),
        }),
        counterMessage: Joi.when('status', {
            is: 'countered',
            then: Joi.string().max(1000).allow(null, '').optional(),
            otherwise: Joi.forbidden(),
        }),
    }),
};
