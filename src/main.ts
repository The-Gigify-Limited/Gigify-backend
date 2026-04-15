'use strict';
import 'module-alias/register';

import { startApp } from '@/app';
import { gracefullyShutdown, initializeDbConnection, logger } from '@/core';

initializeDbConnection().then(startApp).catch(gracefullyShutdown);

process.on('uncaughtException', (error: unknown) => {
    logger.info('Uncaught exception', error);
    process.exit(1);
});

process.on('unhandledRejection', (error: unknown) => {
    logger.info('Unhandled rejection', error);
    process.exit(1);
});
