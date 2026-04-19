import { ControllerArgs, HttpStatus, logger } from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { GigRepository, GigReminderRepository } from '../../repository';
import { Gig } from '../../interfaces';

// Reminder windows in hours before the gig start. Each window fires a
// separate notification row per participant, deduped via gig_reminders_sent.
const WINDOW_HOURS = [24, 2] as const;

// Width around the target window within which we consider a gig "due" for
// the reminder. A wider bracket tolerates scheduler drift — if the cron
// misses a tick, the next run still catches the gig.
const BRACKET_MINUTES = 15;

export class SendGigReminders {
    constructor(
        private readonly gigRepository: GigRepository = new GigRepository(),
        private readonly gigReminderRepository: GigReminderRepository = new GigReminderRepository(),
    ) {}

    handle = async (_args?: ControllerArgs) => {
        const now = new Date();
        let sentCount = 0;

        for (const windowHours of WINDOW_HOURS) {
            const targetStart = new Date(now.getTime() + (windowHours * 60 - BRACKET_MINUTES) * 60_000);
            const targetEnd = new Date(now.getTime() + (windowHours * 60 + BRACKET_MINUTES) * 60_000);

            const fromDate = targetStart.toISOString().slice(0, 10);
            const toDate = targetEnd.toISOString().slice(0, 10);

            const candidateGigs = await this.gigRepository.findGigsStartingWithin(fromDate, toDate);

            for (const gig of candidateGigs) {
                const gigStart = resolveGigStart(gig);
                if (!gigStart) continue;
                if (gigStart < targetStart || gigStart > targetEnd) continue;

                const recipients = await this.resolveRecipients(gig);
                for (const userId of recipients) {
                    const already = await this.gigReminderRepository.hasSent(gig.id, userId, windowHours);
                    if (already) continue;

                    await notificationDispatcher.dispatch({
                        userId,
                        type: 'gig_update',
                        title: windowHours === 24 ? `Reminder: gig starts in 24 hours` : `Reminder: gig starts in 2 hours`,
                        message: `${gig.title} is scheduled for ${gigStart.toISOString()}.`,
                        payload: {
                            gigId: gig.id,
                            gigTitle: gig.title,
                            windowHours,
                            gigStartAt: gigStart.toISOString(),
                        },
                        preferenceKey: 'gigUpdates',
                    });

                    await this.gigReminderRepository.markSent(gig.id, userId, windowHours);
                    sentCount += 1;
                }
            }
        }

        logger.info('Gig reminders processed', { sentCount });

        return {
            code: HttpStatus.OK,
            message: 'Gig Reminders Processed Successfully',
            data: { sentCount },
        };
    };

    private async resolveRecipients(gig: Gig): Promise<string[]> {
        const recipients = new Set<string>();
        if (gig.employerId) recipients.add(gig.employerId);

        const hiredTalentIds = await this.gigRepository.findHiredTalentIdsForGig(gig.id);
        for (const talentId of hiredTalentIds) {
            recipients.add(talentId);
        }

        return Array.from(recipients);
    }
}

function resolveGigStart(gig: Gig): Date | null {
    if (!gig.gigDate) return null;
    // Combine the gig date (YYYY-MM-DD) with start_time if available.
    // Interpret the combined timestamp as UTC — without the trailing 'Z',
    // Node parses it in the host's local timezone, which shifts the 24h /
    // 2h reminder windows by the TZ offset in non-UTC environments (CI, Fly
    // machines in different regions). Gigs don't yet carry a timezone column
    // so UTC is the least-wrong default.
    const base = gig.gigDate;
    const time = gig.startTime ?? '00:00:00';
    const combined = new Date(`${base}T${time}Z`);
    return Number.isNaN(combined.getTime()) ? null : combined;
}

const sendGigReminders = new SendGigReminders();
export default sendGigReminders;
