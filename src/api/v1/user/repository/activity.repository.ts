import { BaseRepository, supabaseAdmin } from '@/core';
import { Json } from '@/core/types';
import { normalizePagination } from '@/core/utils/pagination';
import { Activity, ActivityTypeEnum, DatabaseActivity } from '../interfaces';

export class ActivityRepository extends BaseRepository<DatabaseActivity, Activity> {
    protected readonly table = 'activities';

    async logActivity(userId: string, eventType: ActivityTypeEnum, referenceId?: string | null, metadata?: Json | null): Promise<Activity> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: userId,
                event_type: eventType,
                reference_id: referenceId ?? null,
                metadata: metadata ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Failed to create activity log');
        }

        return this.mapToCamelCase(data);
    }

    async getUserTimeline(userId: string, query: { page?: number | string; pageSize?: number | string }): Promise<Activity[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        const { data = [], error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map(this.mapToCamelCase);
    }
}

const activityRepository = new ActivityRepository();
export default activityRepository;
