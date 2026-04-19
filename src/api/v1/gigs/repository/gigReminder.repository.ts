import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseTable } from '@/core/types';

type DatabaseGigReminder = DatabaseTable['gig_reminders_sent']['Row'];
type GigReminder = {
    gigId: string;
    userId: string;
    windowHours: number;
    sentAt: string;
};

export class GigReminderRepository extends BaseRepository<DatabaseGigReminder, GigReminder> {
    protected readonly table = 'gig_reminders_sent';

    async hasSent(gigId: string, userId: string, windowHours: number): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('gig_id')
            .eq('gig_id', gigId)
            .eq('user_id', userId)
            .eq('window_hours', windowHours)
            .maybeSingle();

        if (error) throw error;
        return data !== null;
    }

    async markSent(gigId: string, userId: string, windowHours: number): Promise<void> {
        const { error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                { gig_id: gigId, user_id: userId, window_hours: windowHours },
                { onConflict: 'gig_id,user_id,window_hours', ignoreDuplicates: true },
            );

        if (error) throw error;
    }
}

const gigReminderRepository = new GigReminderRepository();
export default gigReminderRepository;
