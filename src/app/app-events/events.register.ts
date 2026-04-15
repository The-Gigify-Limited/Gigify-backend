import { config, logger } from '@/core';
import { createEmployerProfileListener, getEmployerProfileByUserIdEventListener } from '~/employers/listeners';
import {
    getAllGigsEventListener,
    getGigByIdEventListener,
    updateGigReportStatusEventListener,
    findApplicationByGigAndTalentEventListener,
} from '~/gigs/listeners';
import { dispatchNotificationEventListener } from '~/notifications/listeners';
import {
    createTalentEventListener,
    getTalentProfileByUserId,
    getTalentReviewsEventListener,
    createTalentReviewEventListener,
} from '~/talents/listeners';
import { checkNotificationPreferenceEventListener, getUserByIdEventListener, createActivityEventListener } from '~/user/listeners';
import { updatePayoutRequestStatusEventListener, createEarningsRecordEventListener } from '~/earnings/listeners';
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
    bus.onEvent('user:check-notification-preference', (input) => checkNotificationPreferenceEventListener(input));
    bus.onEvent('employer:create-profile', ({ user_id }) => createEmployerProfileListener(user_id));
    bus.onEvent('employer:get-profile', ({ user_id }) => getEmployerProfileByUserIdEventListener(user_id));
    bus.onEvent('talent:create-talent', ({ user_id }) => createTalentEventListener(user_id));
    bus.onEvent('talent:get-talent-profile', ({ user_id }) => getTalentProfileByUserId(user_id));
    bus.onEvent('talent:get-reviews', (input) => getTalentReviewsEventListener(input));
    bus.onEvent('talent:create-review', (input) => createTalentReviewEventListener(input));
    bus.onEvent('gig:get-by-id', ({ gigId }) => getGigByIdEventListener(gigId));
    bus.onEvent('gig:get-all', ({ query }) => getAllGigsEventListener(query));
    bus.onEvent('gig:update-report-status', (input) => updateGigReportStatusEventListener(input));
    bus.onEvent('gig:find-application', (input) => findApplicationByGigAndTalentEventListener(input));
    bus.onEvent('user:create-activity', (input) => createActivityEventListener(input));
    bus.onEvent('earnings:create-record', (input) => createEarningsRecordEventListener(input));
    bus.onEvent('notification:dispatch', (input) => dispatchNotificationEventListener(input));
}
