import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    getConversationMessages,
    getMyConversations,
    getUnreadConversationCount,
    markConversationRead,
    openConversation,
    sendMessage,
} from '../services';
import {
    conversationIdSchema,
    conversationsQuerySchema,
    openConversationSchema,
    sendMessageSchema,
} from './schema';

export const chatRouter = Router();

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Get the current user's conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation list
 *         content:
 *           application/json:
 *             example:
 *               message: Conversations Retrieved Successfully
 *               data:
 *                 - id: 80000000-0000-0000-0000-000000000001
 *                   gigId: 50000000-0000-0000-0000-000000000005
 *                   employerId: 10000000-0000-0000-0000-000000000002
 *                   talentId: 20000000-0000-0000-0000-000000000001
 *                   unreadCount: 1
 */
chatRouter.get(
    '/conversations',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(conversationsQuerySchema)
        .setHandler(getMyConversations.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/unread-count:
 *   get:
 *     tags: [Chat]
 *     summary: Get unread conversation count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             example:
 *               message: Unread Conversation Count Retrieved Successfully
 *               data:
 *                 count: 2
 */
chatRouter.get(
    '/conversations/unread-count',
    ControlBuilder.builder()
        .isPrivate()
        .setHandler(getUnreadConversationCount.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/open:
 *   post:
 *     tags: [Chat]
 *     summary: Open or create a conversation between a talent and employer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             gigId: 50000000-0000-0000-0000-000000000005
 *             talentId: 20000000-0000-0000-0000-000000000001
 *     responses:
 *       200:
 *         description: Conversation opened
 *         content:
 *           application/json:
 *             example:
 *               message: Conversation Opened Successfully
 *               data:
 *                 id: 80000000-0000-0000-0000-000000000001
 *                 gigId: 50000000-0000-0000-0000-000000000005
 *                 employerId: 10000000-0000-0000-0000-000000000002
 *                 talentId: 20000000-0000-0000-0000-000000000001
 */
chatRouter.post(
    '/conversations/open',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(openConversationSchema)
        .setHandler(openConversation.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get messages for a conversation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message list
 *         content:
 *           application/json:
 *             example:
 *               message: Conversation Messages Retrieved Successfully
 *               data:
 *                 - id: 81000000-0000-0000-0000-000000000001
 *                   conversationId: 80000000-0000-0000-0000-000000000001
 *                   senderId: 10000000-0000-0000-0000-000000000002
 *                   body: Hi Maxell, can you share a quick club set reference?
 */
chatRouter.get(
    '/conversations/:id/messages',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator({ ...conversationIdSchema, ...conversationsQuerySchema })
        .setHandler(getConversationMessages.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message in a conversation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             body: Absolutely, I will send a 60-second reel in a moment.
 *             attachmentUrl: null
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             example:
 *               message: Message Sent Successfully
 *               data:
 *                 id: 81000000-0000-0000-0000-000000000006
 *                 conversationId: 80000000-0000-0000-0000-000000000001
 *                 senderId: 20000000-0000-0000-0000-000000000001
 *                 body: Absolutely, I will send a 60-second reel in a moment.
 */
chatRouter.post(
    '/conversations/:id/messages',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(sendMessageSchema)
        .setHandler(sendMessage.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/{id}/read:
 *   post:
 *     tags: [Chat]
 *     summary: Mark every unread message in a conversation as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation updated
 *         content:
 *           application/json:
 *             example:
 *               message: Conversation Marked as Read Successfully
 *               data:
 *                 conversationId: 80000000-0000-0000-0000-000000000001
 *                 readCount: 1
 */
chatRouter.post(
    '/conversations/:id/read',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(conversationIdSchema)
        .setHandler(markConversationRead.handle)
        .handle(),
);
