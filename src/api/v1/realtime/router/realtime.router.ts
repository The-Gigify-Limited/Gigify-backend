import { ControlBuilder } from '@/core';
import { Router } from 'express';
import { getRealtimeConfig } from '../services';

export const realtimeRouter = Router();

/**
 * @swagger
 * /realtime/config:
 *   get:
 *     tags: [Realtime]
 *     summary: Get Supabase Realtime configuration for WebSocket connections
 *     description: |
 *       Returns the Supabase URL and anon key needed to establish WebSocket
 *       connections on the frontend via Supabase Realtime.
 *
 *       **Channels the frontend should subscribe to:**
 *       - `user:{userId}` — personal notifications (new_notification, notification_read)
 *       - `conversation:{conversationId}` — chat messages (new_message, message_read)
 *
 *       Use `supabase.channel(channelName).on('broadcast', { event }, callback).subscribe()`
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Realtime configuration
 *         content:
 *           application/json:
 *             example:
 *               message: Realtime Configuration Retrieved Successfully
 *               data:
 *                 supabaseUrl: https://example.supabase.co
 *                 supabaseAnonKey: eyJ...
 *       401:
 *         description: Unauthorized
 */
realtimeRouter.get(
    '/config',
    ControlBuilder.builder()
        .isPrivate()
        .setHandler(getRealtimeConfig.handle)
        .handle(),
);
