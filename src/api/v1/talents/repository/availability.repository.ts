import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseTalentAvailability, TalentAvailability } from '../interfaces';

export class AvailabilityRepository extends BaseRepository<DatabaseTalentAvailability, TalentAvailability> {
    protected readonly table = 'talent_availability';

    async listForTalent(talentUserId: string, range: { from?: string; to?: string }): Promise<TalentAvailability[]> {
        let request = supabaseAdmin.from(this.table).select('*').eq('talent_user_id', talentUserId);

        // Filter expression: rows that OVERLAP [from, to]. In SQL terms,
        // unavailable_from < to AND unavailable_until > from. The window is
        // inclusive-open on `from` and open on `to` so back-to-back busy
        // ranges don't double-count.
        if (range.to) request = request.lt('unavailable_from', range.to);
        if (range.from) request = request.gt('unavailable_until', range.from);

        const { data = [], error } = await request.order('unavailable_from', { ascending: true });
        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async findAvailabilityById(id: string): Promise<TalentAvailability | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.mapToCamelCase(data) : null;
    }

    async addManual(input: {
        talentUserId: string;
        unavailableFrom: string;
        unavailableUntil: string;
        reason?: string | null;
    }): Promise<TalentAvailability> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                talent_user_id: input.talentUserId,
                unavailable_from: input.unavailableFrom,
                unavailable_until: input.unavailableUntil,
                reason: input.reason ?? null,
                source: 'manual',
            })
            .select('*')
            .single();

        if (error) throw error;
        return this.mapToCamelCase(data);
    }

    async addAutoFromGig(input: {
        talentUserId: string;
        gigId: string;
        unavailableFrom: string;
        unavailableUntil: string;
    }): Promise<TalentAvailability | null> {
        // Auto rows are upsert-ish on (talent_user_id, gig_id). We don't have
        // a DB-level unique constraint there because a gig could theoretically
        // be re-hired (cancel → re-offer → accept), so instead we check for
        // existing auto rows and skip to avoid duplicates.
        const { data: existing, error: selectError } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('talent_user_id', input.talentUserId)
            .eq('gig_id', input.gigId)
            .eq('source', 'auto_from_gig')
            .maybeSingle();

        if (selectError) throw selectError;
        if (existing) return this.mapToCamelCase(existing);

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                talent_user_id: input.talentUserId,
                unavailable_from: input.unavailableFrom,
                unavailable_until: input.unavailableUntil,
                source: 'auto_from_gig',
                gig_id: input.gigId,
                reason: 'Booked gig',
            })
            .select('*')
            .single();

        if (error) throw error;
        return data ? this.mapToCamelCase(data) : null;
    }

    async deleteById(id: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('id', id);
        if (error) throw error;
    }

    async deleteAutoForGig(gigId: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('gig_id', gigId).eq('source', 'auto_from_gig');
        if (error) throw error;
    }
}

const availabilityRepository = new AvailabilityRepository();
export default availabilityRepository;
