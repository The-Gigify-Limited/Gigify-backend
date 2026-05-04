import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    getEmployerById,
    getEmployerDashboard,
    getEmployerGigs,
    getEmployerProfile,
    upsertEmployerProfile,
} from '../services';
import {
    getEmployerGigsSchema,
    getEmployerParamsSchema,
    upsertEmployerProfileSchema,
} from './schema';

export const employerRouter = Router();

/**
 * @swagger
 * /employer/{id}:
 *   get:
 *     tags: [Employer]
 *     summary: Get employer profile by user ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employer profile
 *         content:
 *           application/json:
 *             example:
 *               message: Employer Retrieved Successfully
 *               data:
 *                 user:
 *                   id: 10000000-0000-0000-0000-000000000002
 *                   firstName: John
 *                   lastName: Doe
 *                   email: john@example.com
 *                 profile:
 *                   id: 11000000-0000-0000-0000-000000000002
 *                   userId: 10000000-0000-0000-0000-000000000002
 *                   organizationName: Pulse Live
 *                   companyWebsite: https://pulselive.example
 *                   industry: Entertainment
 *                   totalGigsPosted: 5
 *                   totalSpent: 940000
 *                   totalApplicationsReceived: 42
 */
employerRouter.get(
    '/:id',
    ControlBuilder.builder()
        .setValidator(getEmployerParamsSchema)
        .setHandler(getEmployerById.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/{id}/profile:
 *   get:
 *     tags: [Employer]
 *     summary: Get employer profile by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employer profile
 *         content:
 *           application/json:
 *             example:
 *               message: Employer Profile Retrieved Successfully
 *               data:
 *                 id: 11000000-0000-0000-0000-000000000002
 *                 userId: 10000000-0000-0000-0000-000000000002
 *                 organizationName: Pulse Live
 *                 companyWebsite: https://pulselive.example
 *                 industry: Entertainment
 *                 totalGigsPosted: 5
 *                 totalSpent: 940000
 *                 totalApplicationsReceived: 42
 */
employerRouter.get(
    '/:id/profile',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(getEmployerParamsSchema)
        .setHandler(getEmployerProfile.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/{id}/profile:
 *   patch:
 *     tags: [Employer]
 *     summary: Update employer profile by ID
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
 *             organizationName: Pulse Live
 *             companyWebsite: https://pulselive.example
 *             industry: Entertainment
 *     responses:
 *       200:
 *         description: Employer profile updated
 *         content:
 *           application/json:
 *             example:
 *               message: Employer Profile Updated Successfully
 *               data:
 *                 id: 11000000-0000-0000-0000-000000000002
 *                 userId: 10000000-0000-0000-0000-000000000002
 *                 organizationName: Pulse Live
 *                 companyWebsite: https://pulselive.example
 *                 industry: Entertainment
 *                 totalApplicationsReceived: 42
 */
employerRouter.patch(
    '/:id/profile',
    ControlBuilder.builder()
        .only('employer')
        .setValidator({
            ...getEmployerParamsSchema,
            ...upsertEmployerProfileSchema,
        })
        .setHandler(upsertEmployerProfile.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/{id}/dashboard:
 *   get:
 *     tags: [Employer]
 *     summary: Get employer dashboard summary by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employer dashboard data
 *         content:
 *           application/json:
 *             example:
 *               message: Employer Dashboard Retrieved Successfully
 *               data:
 *                 profile:
 *                   id: 11000000-0000-0000-0000-000000000002
 *                   organizationName: Pulse Live
 *                 openGigs: 3
 *                 inProgressGigs: 1
 *                 completedGigs: 1
 *                 pendingApplications: 6
 *                 pendingPayments: 2
 */
employerRouter.get(
    '/:id/dashboard',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(getEmployerParamsSchema)
        .setHandler(getEmployerDashboard.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/{id}/gigs:
 *   get:
 *     tags: [Employer]
 *     summary: Get all gigs posted by a specific employer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, in_progress, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Gigs posted by the employer
 *         content:
 *           application/json:
 *             example:
 *               message: Employer Gigs Retrieved Successfully
 *               data:
 *                 - id: 20000000-0000-0000-0000-000000000001
 *                   title: DJ Set for Launch Party
 *                   status: open
 *                   employerId: 10000000-0000-0000-0000-000000000002
 *                   gigDate: 2026-05-12
 *                   budgetAmount: 250000
 */
employerRouter.get(
    '/:id/gigs',
    ControlBuilder.builder()
        .setValidator(getEmployerGigsSchema)
        .setHandler(getEmployerGigs.handle)
        .handle(),
);
