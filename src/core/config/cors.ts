import type { CorsOptions } from 'cors';
import { config } from './config';

const allowedOrigins: string | RegExp | (string | RegExp)[] = [config.frontendOriginUrl];

const allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const allowedHeaders: string[] = ['Content-Type', 'Authorization'];

export const corsOptions: CorsOptions = {
    methods: allowedMethods,
    allowedHeaders,
    origin: allowedOrigins,
};
