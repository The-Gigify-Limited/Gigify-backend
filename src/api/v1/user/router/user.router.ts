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
     * /users/{id}:
     *   get:
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
     * /users:
     *   get:
     *     summary: List users
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
            // .isPrivate()
            .setValidator(getUsersQuerySchema)
            .setHandler(getAllUsers.handle)
            .handle(),
    )
    /**
     * @swagger
     * /users/{id}:
     *   patch:
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
            .handle(),
    )
    /**
     * @swagger
     * /users/{id}:
     *   delete:
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
    );
