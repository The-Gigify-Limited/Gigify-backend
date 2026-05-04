import 'module-alias/register';
import 'dotenv/config';

import { log, SEED_PASSWORD } from './helpers';
import { seedChat } from './chat';
import { seedGigs } from './gigs';
import { seedMisc } from './misc';
import { seedNotifications } from './notifications';
import { seedPayments } from './payments';
import { seedUsers } from './users';

async function main(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== '1') {
        throw new Error('[seed] refused to run in production without FORCE_SEED=1');
    }

    log('main', `shared test password: ${SEED_PASSWORD}`);
    log('main', `all seeded emails follow pattern seed.<role><n>@gigify.test`);

    // Order matters, children depend on parents. Within each seed file, the
    // upserts are idempotent so re-running is safe.
    await seedUsers();
    await seedGigs();
    await seedPayments();
    await seedChat();
    await seedNotifications();
    await seedMisc();

    log('main', 'seed complete');
}

main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
});
