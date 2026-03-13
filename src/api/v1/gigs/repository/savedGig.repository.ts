import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseSavedGig, SavedGig } from '../interfaces';

export class SavedGigRepository extends BaseRepository<DatabaseSavedGig, SavedGig> {
    protected readonly table = 'saved_gigs';

    async findByUserAndGig(userId: string, gigId: string): Promise<SavedGig | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', userId).eq('gig_id', gigId).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async saveGig(userId: string, gigId: string): Promise<SavedGig> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id: userId,
                    gig_id: gigId,
                },
                { onConflict: 'user_id,gig_id' },
            )
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async removeGig(userId: string, gigId: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('user_id', userId).eq('gig_id', gigId);

        if (error) throw error;
    }

    async getSavedGigsForUser(userId: string, query: { page?: number | string; pageSize?: number | string }): Promise<SavedGig[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        const { data = [], error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }
}

const savedGigRepository = new SavedGigRepository();
export default savedGigRepository;
