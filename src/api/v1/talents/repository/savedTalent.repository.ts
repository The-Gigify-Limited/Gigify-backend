import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseSavedTalent, SavedTalent } from '../interfaces';

export class SavedTalentRepository extends BaseRepository<DatabaseSavedTalent, SavedTalent> {
    protected readonly table = 'saved_talents';

    async findByUserAndTalent(userId: string, talentId: string): Promise<SavedTalent | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', userId).eq('talent_id', talentId).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async saveTalent(userId: string, talentId: string): Promise<SavedTalent> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert({ user_id: userId, talent_id: talentId }, { onConflict: 'user_id,talent_id' })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async removeTalent(userId: string, talentId: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('user_id', userId).eq('talent_id', talentId);

        if (error) throw error;
    }

    async getSavedTalentsForUser(userId: string, query: { page?: number | string; pageSize?: number | string }): Promise<SavedTalent[]> {
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

const savedTalentRepository = new SavedTalentRepository();
export default savedTalentRepository;
