import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    archiveConversation,
    blockUser,
    getConversationMessages,
    getMyConversations,
    getUnreadConversationCount,
    listMyBlocks,
    markConversationRead,
    openConversation,
    reportMessage,
    sendMessage,
    sendTypingIndicator,
    unarchiveConversation,
    unblockUser,
} from '../services';
import {
    blockUserSchema,
    conversationIdSchema,
    conversationsQuerySchema,
    openConversationSchema,
    reportMessageSchema,
    sendMessageSchema,
    typingIndicatorSchema,
    unblockUserSchema,
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

/**
 * @swagger
 * /chat/conversations/{id}/archive:
 *   post:
 *     tags: [Chat]
 *     summary: Archive a conversation for the current user (personal inbox action)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation archived
 */
chatRouter.post(
    '/conversations/:id/archive',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(conversationIdSchema)
        .setHandler(archiveConversation.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/{id}/unarchive:
 *   post:
 *     tags: [Chat]
 *     summary: Unarchive a conversation for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation unarchived
 */
chatRouter.post(
    '/conversations/:id/unarchive',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(conversationIdSchema)
        .setHandler(unarchiveConversation.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/blocks:
 *   get:
 *     tags: [Chat]
 *     summary: List users that the current user has blocked
 *     security:
 *       - bearerAuth: []
 */
chatRouter.get(
    '/blocks',
    ControlBuilder.builder()
        .isPrivate()
        .setHandler(listMyBlocks.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/blocks:
 *   post:
 *     tags: [Chat]
 *     summary: Block a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             userId: 20000000-0000-0000-0000-000000000001
 *             reason: harassment
 */
chatRouter.post(
    '/blocks',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(blockUserSchema)
        .setHandler(blockUser.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/blocks/{userId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Unblock a user
 *     security:
 *       - bearerAuth: []
 */
chatRouter.delete(
    '/blocks/:userId',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(unblockUserSchema)
        .setHandler(unblockUser.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/messages/{id}/report:
 *   post:
 *     tags: [Chat]
 *     summary: Report a message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             reason: spam
 *             description: Unsolicited promotional content
 */
chatRouter.post(
    '/messages/:id/report',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(reportMessageSchema)
        .setHandler(reportMessage.handle)
        .handle(),
);

/**
 * @swagger
 * /chat/conversations/{id}/typing:
 *   post:
 *     tags: [Chat]
 *     summary: Broadcast a typing indicator on the conversation channel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             typing: true
 */
chatRouter.post(
    '/conversations/:id/typing',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(typingIndicatorSchema)
        .setHandler(sendTypingIndicator.handle)
        .handle(),
);
