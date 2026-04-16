import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    getEmployerById,
    getEmployerDashboard,
    getEmployerProfile,
    upsertEmployerProfile,
} from '../services';
import { getEmployerParamsSchema, upsertEmployerProfileSchema } from './schema';

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
