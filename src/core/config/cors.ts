import type { CorsOptions } from 'cors';

const allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const allowedHeaders: string[] = ['Content-Type', 'Authorization'];

export const corsOptions: CorsOptions = {
    methods: allowedMethods,
    allowedHeaders,
    origin: '*',
};
