import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseTalent, Talent } from '../interfaces';

export class TalentRepository extends BaseRepository<DatabaseTalent, Talent> {
    protected readonly table = 'talent_profiles';

    constructor() {
        super();
    }

    async findByUserId(user_id: string): Promise<Talent | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', user_id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async countCompletedGigs(userId: string): Promise<number> {
        const { count, error } = await supabaseAdmin
            .from('gig_applications')
            .select('id, gigs!inner(status)', { count: 'exact', head: true })
            .eq('talent_id', userId)
            .eq('status', 'hired')
            .eq('gigs.status', 'completed');

        if (error) throw error;

        return count ?? 0;
    }

    async createTalentProfile(user_id: string): Promise<Talent> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id,
                },
                {
                    onConflict: 'id',
                    ignoreDuplicates: false,
                },
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        return this.mapToCamelCase(data);
    }
}

const talentRepository = new TalentRepository();
export default talentRepository;
