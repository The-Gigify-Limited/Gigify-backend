import { ControlBuilder } from '@/core';
import { Router } from 'express';

export const gigRouter = Router();

/**
 * @swagger
 * /gig/catalog:
 *   get:
 *     tags: [Gigs]
 *     summary: Get master list of available services/skills
 *     responses:
 *       200:
 *         description: List of service categories
 */
gigRouter.get('/catalog', ControlBuilder.builder().handle());

/**
 * @swagger
 * /gig/explore:
 *   get:
 *     tags: [Gigs]
 *     summary: Search for gigs with filters
 *     parameters:
 *       - in: query
 *         name: service_id
 *         schema: { type: string }
 *       - in: query
 *         name: min_budget
 *         schema: { type: number }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Filtered list of open gigs
 */
gigRouter.get(
    '/explore',
    ControlBuilder.builder()
        // .setHandler(exploreGigs.handle)
        .handle(),
);
/**
 * @swagger
 * /gig:
 *   post:
 *     tags: [Gigs]
 *     summary: Create a new gig posting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               budget_amount: { type: number }
 *               service_id: { type: string, format: uuid }
 *               gig_date: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Gig created
 */
gigRouter.post('/', ControlBuilder.builder().isPrivate().handle());

/**
 * @swagger
 * /gig:
 *   get:
 *     tags: [Gigs]
 *     summary: List all gigs with filters
 *     parameters:
 *       - in: query
 *         name: service_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, completed] }
 *     responses:
 *       200:
 *         description: List of gigs
 */
gigRouter.get('/', ControlBuilder.builder().handle());

/**
 * @swagger
 * /gig/search:
 *   get:
 *     tags: [Gigs]
 *     summary: Comprehensive search for gigs with filters
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Keyword search (title/description)
 *       - in: query
 *         name: location
 *         description: City or coordinates
 *       - in: query
 *         name: service_id
 *         description: Filter by Event Type (e.g., Drummer, DJ)
 *       - in: query
 *         name: min_budget
 *         schema: { type: number }
 *       - in: query
 *         name: max_budget
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of gigs matching criteria
 */
gigRouter.get(
    '/search',
    ControlBuilder.builder()
        // .setValidator(searchGigSchema)
        // .setHandler(searchGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}:
 *   get:
 *     tags: [Gigs]
 *     summary: Get full gig details
 *     description: Returns description, payout breakdown, and policies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detailed gig object for the 'Gig View' screen
 */
gigRouter.get(
    '/:id',
    ControlBuilder.builder()
        // .setHandler(getGigById.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/my-gigs/{status}:
 *   get:
 *     tags: [Talent Gigs]
 *     summary: Get talent's gigs by lifecycle status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema: { type: string, enum: [applied, upcoming, active, completed] }
 */
gigRouter.get(
    '/my-gigs/:status',
    ControlBuilder.builder()
        .isPrivate()
        // .setHandler(getTalentGigsByStatus.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/apply:
 *   post:
 *     tags: [Gigs]
 *     summary: Apply for a gig
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Application submitted
 */
gigRouter.post('/:id/apply', ControlBuilder.builder().isPrivate().handle());
/**
 * @swagger
 * /gig/{id}/status:
 *   patch:
 *     tags: [Gigs]
 *     summary: Change gig status (e.g., mark as Completed or Cancelled)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [completed, cancelled] }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Gig status updated and activity logged
 */
gigRouter.patch(
    '/:id/status',
    ControlBuilder.builder()
        .isPrivate()
        // .setHandler(updateGigStatus.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/hire/{talentId}:
 *   post:
 *     tags: [Gig Management]
 *     summary: Employer hires a talent for a specific gig
 *     description: This moves the gig to 'in_progress' and creates a pending transaction.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: talentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Talent hired successfully
 */
gigRouter.post(
    '/:id/hire/:talentId',
    ControlBuilder.builder()
        .isPrivate()
        // .setHandler(hireTalentForGig.handle)
        .handle(),
);