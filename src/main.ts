'use strict';
import 'module-alias/register';

import { startApp } from '@/app';
import { gracefullyShutdown, initializeDbConnection, logger } from '@/core';

// Initialize the database connection, start the application if successful, or shut down gracefully if an error occurs
initializeDbConnection().then(startApp).catch(gracefullyShutdown);

// Process-wide error handling for uncaught exceptions
process.on('uncaughtException', (error: unknown) => {
    logger.info('Uncaught exception', error);
    process.exit(1);
});

// Process-wide error handling for unhandled promise rejectionsss
process.on('unhandledRejection', (error: unknown) => {
    logger.info('Unhandled rejection', error);
    process.exit(1);
});
