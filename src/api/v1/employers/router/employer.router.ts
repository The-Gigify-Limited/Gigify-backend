import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    getEmployerDashboard,
    getEmployerProfile,
    upsertEmployerProfile,
} from '../services';
import { upsertEmployerProfileSchema } from './schema';

export const employerRouter = Router();

/**
 * @swagger
 * /employer/me:
 *   get:
 *     tags: [Employer]
 *     summary: Get the current employer profile
 *     security:
 *       - bearerAuth: []
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
    '/me',
    ControlBuilder.builder()
        .only('employer')
        .setHandler(getEmployerProfile.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/me:
 *   patch:
 *     tags: [Employer]
 *     summary: Create or update the current employer profile
 *     security:
 *       - bearerAuth: []
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
    '/me',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(upsertEmployerProfileSchema)
        .setHandler(upsertEmployerProfile.handle)
        .handle(),
);

/**
 * @swagger
 * /employer/dashboard:
 *   get:
 *     tags: [Employer]
 *     summary: Get employer dashboard summary
 *     security:
 *       - bearerAuth: []
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
    '/dashboard',
    ControlBuilder.builder()
        .only('employer')
        .setHandler(getEmployerDashboard.handle)
        .handle(),
);
