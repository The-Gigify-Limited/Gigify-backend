import { adminRouter } from '@/api/v1/admin';
import { authRouter } from '@/api/v1/auth';
import { chatRouter } from '@/api/v1/chat';
import { earningsRouter } from '@/api/v1/earnings';
import { employerRouter } from '@/api/v1/employers';
import { gigRouter } from '@/api/v1/gigs';
import { notificationRouter } from '@/api/v1/notifications';
import { realtimeRouter } from '@/api/v1/realtime';
import { talentRouter } from '@/api/v1/talents';
import { userRouter } from '@/api/v1/user';
import { config, HttpStatus } from '@/core';
import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/user', userRouter);
appRouter.use('/gig', gigRouter);
appRouter.use('/talent', talentRouter);
appRouter.use('/employer', employerRouter);
appRouter.use('/earnings', earningsRouter);
appRouter.use('/chat', chatRouter);
appRouter.use('/notifications', notificationRouter);
appRouter.use('/realtime', realtimeRouter);
appRouter.use('/admin', adminRouter);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Gigify API',
            version: '1.0.0',
            description: 'API documentation using Swagger and JSDoc',
        },
        servers:
            config.appEnvironment === 'development'
                ? [
                      {
                          url: 'http://localhost:8000/api/v1',
                          description: 'Local development server',
                      },
                  ]
                : [{ url: '/api/v1', description: 'Production server' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis:
        config.appEnvironment === 'development'
            ? ['./src/app/app.router.ts', './src/api/v1/**/router/*.router.ts']
            : [
                  './build/app/app.router.js',
                  './build/api/v1/**/router/*.router.js',
              ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

appRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Check API availability
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             example:
 *               message: Api up
 *               version: "1.0"
 */
appRouter.get('/health', (_, res) => {
    res.status(HttpStatus.OK).json({
        message: 'Api up',
        version: '1.0',
    });
});
