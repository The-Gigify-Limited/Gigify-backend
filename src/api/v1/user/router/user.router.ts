import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    deleteUserById,
    getAllUsers,
    getUserById,
    updateUserById,
} from '../services';
import {
    getUserParamsSchema,
    getUsersQuerySchema,
    updateUserSchema,
} from './schema';

export const userRouter = Router();

userRouter
    /**
     * @swagger
     * /user/{id}:
     *   get:
     *     tags: [User Profile]
     *     summary: Get user by ID
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
     *         description: User profile
     *       401:
     *         description: Unauthorized
     */
    .get(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUserParamsSchema)
            .setHandler(getUserById.handle)
            .handle(),
    )
  
    /**
     * @swagger
     * /user:
     *   get:
     *     summary: List users
     *     tags: [User Profile]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: pageSize
     *         schema:
     *           type: integer
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *           enum: [talent, employer]
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Users list
     *       401:
     *         description: Unauthorized
     */
    .get(
        '/',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUsersQuerySchema)
            .setHandler(getAllUsers.handle)
            // .only('admin')
            .handle(),
    )
    /**
     * @swagger
     * /user/{id}:
     *   patch:
     *     tags: [User Profile]
     *     summary: Update user profile by ID
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
     *     responses:
     *       200:
     *         description: Updated profile
     *       401:
     *         description: Unauthorized
     */
    .patch(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(updateUserSchema)
            .setHandler(updateUserById.handle)
            .checkResourceOwnership('user', 'id')
            .handle(),
    )
    /**
     * @swagger
     * /user/{id}:
     *   delete:
     *     tags: [User Profile]
     *     summary: Soft delete user account by ID
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
     *         description: Account soft deleted
     *       401:
     *         description: Unauthorized
     */
    .delete(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUserParamsSchema)
            .setHandler(deleteUserById.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/reviews:
     *   post:
     *     tags: [User Reviews]
     *     summary: Submit a new review
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               reviewee_id: { type: string, format: uuid }
     *               gig_id: { type: string, format: uuid }
     *               rating: { type: number, minimum: 1, maximum: 5 }
     *               comment: { type: string }
     *     responses:
     *       201:
     *         description: Review submitted successfully
     */
    .post(
        '/reviews',
        ControlBuilder.builder()
            .isPrivate()
            .setHandler(deleteUserById.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/me/timeline:
     *   get:
     *     tags: [User Activity]
     *     summary: Get user activity timeline
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of user activities (joined, paid, etc.)
     */
    .get(
        '/me/timeline',
        ControlBuilder.builder()
            .isPrivate()
            .setHandler(deleteUserById.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/{id}/reviews:
     *   get:
     *     tags: [User Reviews]
     *     summary: Get reviews for a specific user
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: List of reviews and average rating
     */
    .get(
        '/:id/reviews',
        ControlBuilder.builder().setHandler(deleteUserById.handle).handle(),
    )
    /**
     * @swagger
     * /user/onboarding/liveness:
     *   post:
     *     tags: [User Identity]
     *     summary: Upload liveness video/photo for identity verification
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               media_url: { type: string }
     *               id_type: { type: string, enum: [passport, drivers_license] }
     *     responses:
     *       200:
     *         description: Verification submitted for review
     */
    .post('/onboarding/liveness', ControlBuilder.builder().isPrivate().handle())

    /**
     * @swagger
     * /user/settings/notifications:
     *   patch:
     *     tags: [User Settings]
     *     summary: Update push/email notification preferences
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               push_enabled: { type: boolean }
     *               payout_alerts: { type: boolean }
     *     responses:
     *       200:
     *         description: Settings updated
     */
    .patch(
        '/settings/notifications',
        ControlBuilder.builder().isPrivate().handle(),
    );
