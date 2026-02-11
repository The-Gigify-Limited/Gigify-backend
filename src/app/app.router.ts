import { authRouter } from '@/api/v1/auth';
import { userRouter } from '@/api/v1/user';
import { gigRouter } from '@/api/v1/user/router/gig.router';
import { config, HttpStatus } from '@/core';
import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/user', userRouter);
appRouter.use('/gig', gigRouter);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Gigify API',
            version: '1.0.0',
            description: 'API documentation using Swagger and JSDoc',
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/v1`,
                description: 'Local development server',
            },
        ],
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
    apis: ['./src/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

appRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

appRouter.get('/health', (_, res) => {
    res.status(HttpStatus.OK).json({
        message: 'Api up',
        version: '1.0',
    });
});
