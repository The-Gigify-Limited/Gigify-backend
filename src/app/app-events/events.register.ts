import { config, logger } from '@/core';
import { AppEventManager } from './app.events';

export function registerEvents(bus: AppEventManager) {
    bus.onEvent('app:up', () => {
        logger.info(`Server started successfully on port ${config.port}`);

        if (config.appEnvironment !== 'development') {
            console.log(`Server started successfully on port ${config.port}`);
        }
    });
    bus.onEvent('cache:connection:established', () => logger.info(`Cache connection established`));
    bus.onEvent('event:registration:successful', () => logger.info('Events listeners registered'));


}
