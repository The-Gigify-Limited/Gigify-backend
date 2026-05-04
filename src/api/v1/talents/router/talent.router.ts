import { Router } from 'express';
import { ControlBuilder } from '@/core';
import {
    addAvailability,
    browseTalents,
    createTalentReview,
    deleteAvailability,
    deleteTalentPortfolio,
    getAllTalentReviews,
    getSavedTalents,
    getTalentById,
    getTalentPortfolio,
    listAvailability,
    removeSavedTalent,
    saveTalent,
    updateTalent,
    uploadTalentPortfolio,
} from '../services';
import {
    availabilityCreateSchema,
    availabilityDeleteSchema,
    availabilityListSchema,
    browseTalentsQuerySchema,
    createTalentReviewSchema,
    getUserParamsSchema,
    savedTalentsQuerySchema,
    talentPortfolioParamSchema,
    talentReviewsQuerySchema,
    updateTalentSchema,
} from './schema';

export const talentRouter = Router();

/**
 * @swagger
 * /talent:
 *   get:
 *     tags: [Talent]
 *     summary: Browse / search the talent directory
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *       - in: query
 *         name: search
 *         description: Substring (ilike) match on `stage_name`, `primary_role`, OR the talent's `users.first_name` / `users.last_name`.
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: primaryRole
 *         description: Substring (ilike) match on `primary_role` OR exact membership in `skills[]`. Either column matches because many talents store the role as a skill rather than on the dedicated column.
 *         schema: { type: string, maxLength: 80 }
 *       - in: query
 *         name: genres
 *         description: Array of skill labels matched against `skills[]` with overlap (any-match) semantics.
 *         schema:
 *           type: array
 *           items: { type: string, maxLength: 80 }
 *       - in: query
 *         name: minRate
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: maxRate
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: rateCurrency
 *         schema: { type: string, maxLength: 8 }
 *       - in: query
 *         name: minRating
 *         schema: { type: number, minimum: 0, maximum: 5 }
 *       - in: query
 *         name: location
 *         description: General location filter. Substring (ilike) match against `users.location_city` OR `users.location_country`.
 *         schema: { type: string, maxLength: 120 }
 *       - in: query
 *         name: locationCity
 *         description: Exact match on `users.location_city`. For fuzzy matching across both city and country, use `location` instead.
 *         schema: { type: string, maxLength: 120 }
 *       - in: query
 *         name: locationCountry
 *         description: Exact match on `users.location_country`.
 *         schema: { type: string, maxLength: 120 }
 *       - in: query
 *         name: lat
 *         schema: { type: number, minimum: -90, maximum: 90 }
 *       - in: query
 *         name: lng
 *         schema: { type: number, minimum: -180, maximum: 180 }
 *       - in: query
 *         name: radiusKm
 *         description: Geo radius (km) around `lat`/`lng`. Requires all three.
 *         schema: { type: number, minimum: 1, maximum: 500 }
 *       - in: query
 *         name: availableOn
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [rating, priceAsc, priceDesc, recent], default: rating }
 */
talentRouter.get(
    '/',
    ControlBuilder.builder()
        .setValidator(browseTalentsQuerySchema)
        .setHandler(browseTalents.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/saved:
 *   get:
 *     tags: [Talent]
 *     summary: List the current employer's saved talents
 *     security:
 *       - bearerAuth: []
 */
talentRouter.get(
    '/saved',
    ControlBuilder.builder()
        .isPrivate()
        .only('employer')
        .setValidator(savedTalentsQuerySchema)
        .setHandler(getSavedTalents.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/availability:
 *   post:
 *     tags: [Talent]
 *     summary: Mark the current talent unavailable for a window
 *     security:
 *       - bearerAuth: []
 */
talentRouter.post(
    '/availability',
    ControlBuilder.builder()
        .isPrivate()
        .only('talent')
        .setValidator(availabilityCreateSchema)
        .setHandler(addAvailability.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/availability/{id}:
 *   delete:
 *     tags: [Talent]
 *     summary: Delete a manual availability entry (auto rows are read-only)
 *     security:
 *       - bearerAuth: []
 */
talentRouter.delete(
    '/availability/:id',
    ControlBuilder.builder()
        .isPrivate()
        .only('talent')
        .setValidator(availabilityDeleteSchema)
        .setHandler(deleteAvailability.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}:
 *   get:
 *     tags: [Talent]
 *     summary: Get a talent profile by user ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Talent profile with portfolios and reviews
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Retrieved Successfully
 *               data:
 *                 id: 30000000-0000-0000-0000-000000000001
 *                 userId: 20000000-0000-0000-0000-000000000001
 *                 stageName: DJ Maxell
 *                 primaryRole: DJ
 *                 averageRating: 4.8
 *                 totalGigsCompleted: 12
 *                 bankName: GTBank
 *                 accountNumber: "0123456789"
 *                 portfolios: []
 *                 reviews: []
 */
talentRouter.get(
    '/:id',
    ControlBuilder.builder()
        .setValidator(getUserParamsSchema)
        .setHandler(getTalentById.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}:
 *   patch:
 *     tags: [Talent]
 *     summary: Update a talent profile by user ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stageName: { type: string, minLength: 1, maxLength: 60 }
 *               primaryRole: { type: string, maxLength: 80 }
 *               biography: { type: string, maxLength: 1000 }
 *               dateOfBirth: { type: string, format: date }
 *               minRate: { type: number, minimum: 0 }
 *               maxRate: { type: number, minimum: 0 }
 *               rateCurrency: { type: string, maxLength: 8 }
 *               skills:
 *                 type: array
 *                 items: { type: string, maxLength: 80 }
 *               yearsExperience: { type: integer, minimum: 0 }
 *               bannerUrl: { type: string, format: uri }
 *               bankName:
 *                 type: string
 *                 maxLength: 120
 *                 description: Direct-bank-transfer payout account holder bank name (NGN context, not Stripe Connect).
 *               accountNumber:
 *                 type: string
 *                 maxLength: 40
 *                 description: Direct-bank-transfer payout account number.
 *           example:
 *             stageName: DJ Maxell
 *             primaryRole: DJ
 *             biography: High-energy Afrobeat and wedding DJ with a club-ready set list.
 *             minRate: 120000
 *             maxRate: 300000
 *             rateCurrency: NGN
 *             skills:
 *               - afrobeat
 *               - wedding
 *             bankName: GTBank
 *             accountNumber: "0123456789"
 *     responses:
 *       200:
 *         description: Updated talent profile
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Updated Successfully
 *               data:
 *                 id: 30000000-0000-0000-0000-000000000001
 *                 stageName: DJ Maxell
 *                 primaryRole: DJ
 *                 bankName: GTBank
 *                 accountNumber: "0123456789"
 */
talentRouter.patch(
    '/:id',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(updateTalentSchema)
        .checkResourceOwnership('user', 'id')
        .setHandler(updateTalent.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/portfolios:
 *   get:
 *     tags: [Talent]
 *     summary: Get talent portfolios by user ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Talent portfolios
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Portfolio Retrieved Successfully
 *               data:
 *                 - id: 31000000-0000-0000-0000-000000000001
 *                   talentId: 30000000-0000-0000-0000-000000000001
 *                   portfolioUrl: https://portfolio.gigify.app/dj-maxell/afterparty-reel
 */
talentRouter.get(
    '/:id/portfolios',
    ControlBuilder.builder()
        .setValidator(getUserParamsSchema)
        .setHandler(getTalentPortfolio.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/portfolios:
 *   post:
 *     tags: [Talent]
 *     summary: Upload talent portfolio assets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             portfolioUrls:
 *               - https://portfolio.gigify.app/dj-maxell/afterparty-reel
 *               - https://portfolio.gigify.app/dj-maxell/lounge-cut
 *     responses:
 *       201:
 *         description: Portfolio assets created
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Portfolio Uploaded Successfully
 *               data:
 *                 - id: 31000000-0000-0000-0000-000000000001
 *                   portfolioUrl: https://portfolio.gigify.app/dj-maxell/afterparty-reel
 */
talentRouter.post(
    '/portfolios',
    ControlBuilder.builder()
        .only('talent')
        .setHandler(uploadTalentPortfolio.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/portfolios/{talentPortfolioId}:
 *   delete:
 *     tags: [Talent]
 *     summary: Delete a single talent portfolio item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: talentPortfolioId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Portfolio deleted
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Portfolio Deleted Successfully
 */
talentRouter.delete(
    '/portfolios/:talentPortfolioId',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(talentPortfolioParamSchema)
        .setHandler(deleteTalentPortfolio.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/reviews:
 *   get:
 *     tags: [Talent]
 *     summary: Get reviews for a talent by user ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Talent review feed
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Reviews Retrieved Successfully
 *               data:
 *                 reviews:
 *                   - id: 32000000-0000-0000-0000-000000000001
 *                     rating: 5
 *                     comment: Ada kept the room calm and elegant from guest arrival through the first dance.
 *                 summary:
 *                   - rating: 5
 *                     count: 1
 */
talentRouter.get(
    '/:id/reviews',
    ControlBuilder.builder()
        .setValidator(talentReviewsQuerySchema)
        .setHandler(getAllTalentReviews.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/reviews:
 *   post:
 *     tags: [Talent]
 *     summary: Create a review for a talent by user ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             rating: 5
 *             comment: Ada kept the room calm and elegant from guest arrival through the first dance.
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Review Created Successfully
 *               data:
 *                 id: 32000000-0000-0000-0000-000000000004
 *                 rating: 5
 *                 comment: Ada kept the room calm and elegant from guest arrival through the first dance.
 */
talentRouter.post(
    '/:id/reviews',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(createTalentReviewSchema)
        .setHandler(createTalentReview.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/save:
 *   post:
 *     tags: [Talent]
 *     summary: Bookmark a talent for the current employer
 *     security:
 *       - bearerAuth: []
 */
talentRouter.post(
    '/:id/save',
    ControlBuilder.builder()
        .isPrivate()
        .only('employer')
        .setValidator(getUserParamsSchema)
        .setHandler(saveTalent.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/save:
 *   delete:
 *     tags: [Talent]
 *     summary: Remove a bookmarked talent
 *     security:
 *       - bearerAuth: []
 */
talentRouter.delete(
    '/:id/save',
    ControlBuilder.builder()
        .isPrivate()
        .only('employer')
        .setValidator(getUserParamsSchema)
        .setHandler(removeSavedTalent.handle)
        .handle(),
);

/**
 * @swagger
 * /talent/{id}/availability:
 *   get:
 *     tags: [Talent]
 *     summary: Read a talent's busy windows (for employer availability filters)
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 */
talentRouter.get(
    '/:id/availability',
    ControlBuilder.builder()
        .setValidator(availabilityListSchema)
        .setHandler(listAvailability.handle)
        .handle(),
);
