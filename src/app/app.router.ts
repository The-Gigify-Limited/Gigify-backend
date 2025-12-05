import { HttpStatus } from '@/core';
import { Router } from 'express';

export const appRouter = Router();

appRouter.get('/health', (_, res) => {
    res.status(HttpStatus.OK).json({
        message: 'Api up',
        version: '1.0',
    });
});
