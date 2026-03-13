import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '../services';
import { notificationIdSchema, notificationsQuerySchema } from './schema';

export const notificationRouter = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the current user's notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification list
 *         content:
 *           application/json:
 *             example:
 *               message: Notifications Retrieved Successfully
 *               data:
 *                 - id: 90000000-0000-0000-0000-000000000001
 *                   type: application_update
 *                   title: New gig offer received
 *                   isRead: false
 */
notificationRouter.get('/', ControlBuilder.builder().isPrivate().setValidator(notificationsQuerySchema).setHandler(getMyNotifications.handle).handle());

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             example:
 *               message: Unread Notification Count Retrieved Successfully
 *               data:
 *                 count: 3
 */
notificationRouter.get('/unread-count', ControlBuilder.builder().isPrivate().setHandler(getUnreadNotificationCount.handle).handle());

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark every notification as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *         content:
 *           application/json:
 *             example:
 *               message: Notifications Marked as Read Successfully
 *               data:
 *                 updatedCount: 3
 */
notificationRouter.post('/read-all', ControlBuilder.builder().isPrivate().setHandler(markAllNotificationsRead.handle).handle());

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification updated
 *         content:
 *           application/json:
 *             example:
 *               message: Notification Marked as Read Successfully
 *               data:
 *                 id: 90000000-0000-0000-0000-000000000001
 *                 isRead: true
 */
notificationRouter.patch('/:id/read', ControlBuilder.builder().isPrivate().setValidator(notificationIdSchema).setHandler(markNotificationRead.handle).handle());
