import { ControlBuilder } from '@/core';
import { Router } from 'express';
import { getRealtimeConfig } from '../services';

export const realtimeRouter = Router();

/**
 * @swagger
 * /realtime/config:
 *   get:
 *     tags: [Realtime]
 *     summary: Get Supabase Realtime configuration
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
 */
realtimeRouter.get(
    '/config',
    ControlBuilder.builder()
        .isPrivate()
        .setHandler(getRealtimeConfig.handle)
        .handle(),
);
