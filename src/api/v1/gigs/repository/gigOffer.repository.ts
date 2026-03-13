import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseGigOffer, GigOffer, OfferStatusEnum } from '../interfaces';

export class GigOfferRepository extends BaseRepository<DatabaseGigOffer, GigOffer> {
    protected readonly table = 'gig_offers';

    async createOffer(input: {
        gigId: string;
        employerId: string;
        talentId: string;
        message?: string | null;
        proposedRate?: number | null;
        currency?: string | null;
        expiresAt?: string | null;
    }): Promise<GigOffer> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                gig_id: input.gigId,
                employer_id: input.employerId,
                talent_id: input.talentId,
                message: input.message ?? null,
                proposed_rate: input.proposedRate ?? null,
                currency: input.currency ?? 'NGN',
                expires_at: input.expiresAt ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getOfferById(id: string): Promise<GigOffer | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async findPendingOffer(gigId: string, talentId: string): Promise<GigOffer | null> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('gig_id', gigId)
            .eq('talent_id', talentId)
            .eq('status', 'pending')
            .maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async findLatestOfferForGigAndTalent(gigId: string, talentId: string): Promise<GigOffer | null> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('gig_id', gigId)
            .eq('talent_id', talentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getOffersForGig(
        gigId: string,
        query: {
            page?: number | string;
            pageSize?: number | string;
            status?: OfferStatusEnum;
        },
    ): Promise<GigOffer[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*').eq('gig_id', gigId);

        if (query.status) request = request.eq('status', query.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async getOffersForUser(
        userId: string,
        query: {
            page?: number | string;
            pageSize?: number | string;
            status?: OfferStatusEnum;
            direction?: 'received' | 'sent' | 'all';
        },
    ): Promise<GigOffer[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*');

        if (query.direction === 'sent') {
            request = request.eq('employer_id', userId);
        } else if (query.direction === 'received') {
            request = request.eq('talent_id', userId);
        } else {
            request = request.or(`employer_id.eq.${userId},talent_id.eq.${userId}`);
        }

        if (query.status) request = request.eq('status', query.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async updateOffer(id: string, input: Partial<GigOffer>): Promise<GigOffer> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .update({
                ...this.mapToSnakeCase(input),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async expirePendingOffersForGig(gigId: string, exceptTalentId?: string): Promise<GigOffer[]> {
        let request = supabaseAdmin
            .from(this.table)
            .update({
                status: 'expired',
                responded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('gig_id', gigId)
            .eq('status', 'pending');

        if (exceptTalentId) {
            request = request.neq('talent_id', exceptTalentId);
        }

        const { data = [], error } = await request.select('*');

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }
}

const gigOfferRepository = new GigOfferRepository();
export default gigOfferRepository;
