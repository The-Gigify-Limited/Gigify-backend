import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseNotificationPreferences, NotificationPreferences } from '../interfaces';

export class NotificationPreferenceRepository extends BaseRepository<DatabaseNotificationPreferences, NotificationPreferences> {
    protected readonly table = 'notification_preferences';

    async findByUserId(userId: string): Promise<NotificationPreferences | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', userId).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async upsertByUserId(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        const payload = this.mapToSnakeCase({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id: userId,
                    ...payload,
                },
                { onConflict: 'user_id' },
            )
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }
}

const notificationPreferenceRepository = new NotificationPreferenceRepository();
export default notificationPreferenceRepository;
