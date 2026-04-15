import { appRouter } from '@/app';
import { config, corsOptions, errorHandler, notFoundHandler } from '@/core';
import { API_SUFFIX } from '@/core/common';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';

export const app = express();

const captureRawBody = (req: express.Request, _res: express.Response, buffer: Buffer) => {
    if (buffer.length > 0) {
        req.rawBody = buffer.toString('utf8');
    }
};

app.use(
    express.json({
        verify: captureRawBody,
    }),
);

app.use(cookieParser());

app.use(
    fileUpload({
        useTempFiles: true,
    }),
);

app.use(cors(corsOptions));

app.use(express.static('public'));

app.use(
    express.urlencoded({
        extended: false,
        verify: captureRawBody,
    }),
);

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
    }),
);

app.use(API_SUFFIX, appRouter);

app.set('trust proxy', true);

app.use(notFoundHandler.handle);
app.use(errorHandler.handle);
