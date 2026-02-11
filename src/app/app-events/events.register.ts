import { config, logger } from '@/core';
import { createTalentEventListener, getTalentProfileByUserId } from '~/talents/listeners';
import { getUserByIdEventListener } from '~/user/listeners';
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
    bus.onEvent('event:return-name', (name: string) => name);
    bus.onEvent('user:get-by-id', ({ fields, id }) => getUserByIdEventListener(id, fields));

    // TALENTS
    bus.onEvent('talent:create-talent', ({ user_id }) => createTalentEventListener(user_id));
    bus.onEvent('talent:get-talent-profile', ({ user_id }) => getTalentProfileByUserId(user_id));
}
