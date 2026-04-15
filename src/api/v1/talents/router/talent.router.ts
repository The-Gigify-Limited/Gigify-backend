import { Router } from 'express';
import { ControlBuilder } from '@/core';
import {
    createTalentReview,
    deleteTalentPortfolio,
    getAllTalentReviews,
    getTalentById,
    getTalentPortfolio,
    updateTalent,
    uploadTalentPortfolio,
} from '../services';
import {
    createTalentReviewSchema,
    getUserParamsSchema,
    talentPortfolioParamSchema,
    talentReviewsQuerySchema,
    updateTalentSchema,
} from './schema';

export const talentRouter = Router();

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
