import { BadRequestError, BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import {
    ApplicationStatusEnum,
    DatabaseGig,
    DatabaseGigApplication,
    DatabaseServiceCatalog,
    Gig,
    GigApplication,
    ServiceCatalog,
    TalentGigItem,
} from '../interfaces';

export class GigRepository extends BaseRepository<DatabaseGig, Gig> {
    protected readonly table = 'gigs';

    /**
     * Override base camelCase mapping so that the DB column `location_name`
     * is exposed as `venueName` instead of the auto-generated `locationName`.
     */
    mapToCamelCase = (row: DatabaseGig): Gig => {
        const base = Object.fromEntries(Object.entries(row).map(([k, v]) => [this.toCamelCase(k), v])) as Gig & { locationName?: string | null };
        const { locationName, ...rest } = base;
        return { ...rest, venueName: locationName ?? null } as Gig;
    };

    mapToSnakeCase(obj: Partial<Gig>): Partial<DatabaseGig> {
        const { venueName, ...rest } = obj as Partial<Gig> & { venueName?: string | null };
        const snaked = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`), v]),
        ) as Partial<DatabaseGig>;
        if (venueName !== undefined) (snaked as Record<string, unknown>).location_name = venueName;
        return snaked;
    }

    private mapRow<T>(row: Record<string, unknown>): T {
        return Object.fromEntries(Object.entries(row).map(([key, value]) => [this.toCamelCase(key), value])) as T;
    }

    private mapInputToSnakeCase(input: Record<string, unknown>) {
        return Object.fromEntries(
            Object.entries(input).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), value]),
        );
    }

    async getCatalog(): Promise<ServiceCatalog[]> {
        const { data = [], error } = await supabaseAdmin
            .from('services_catalog')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        return (data ?? []).map((row) => this.mapRow<ServiceCatalog>(row));
    }

    async getServiceById(id: string): Promise<ServiceCatalog | null> {
        const { data, error } = await supabaseAdmin.from('services_catalog').select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapRow<ServiceCatalog>(data as unknown as DatabaseServiceCatalog) : null;
    }

    async getAllGigs(query: {
        page?: number | string;
        pageSize?: number | string;
        status?: string;
        serviceId?: string;
        search?: string;
        location?: string;
        minBudget?: number | string;
        maxBudget?: number | string;
        dateFrom?: string;
        dateTo?: string;
        isRemote?: boolean;
        employerId?: string;
    }): Promise<Gig[]> {
        const { offset, rangeEnd } = normalizePagination({
            page: query.page,
            pageSize: query.pageSize,
        });

        let request = supabaseAdmin.from(this.table).select('*');

        if (query.status) request = request.eq('status', query.status as any);
        if (query.serviceId) request = request.eq('service_id', query.serviceId);
        if (query.employerId) request = request.eq('employer_id', query.employerId);
        if (typeof query.isRemote === 'boolean') request = request.eq('is_remote', query.isRemote);
        if (query.search) {
            const escaped = `%${query.search}%`;
            request = request.or(`title.ilike.${escaped},description.ilike.${escaped}`);
        }
        if (query.location) request = request.ilike('location_name', `%${query.location}%`);
        if (query.minBudget !== undefined) request = request.gte('budget_amount', Number(query.minBudget));
        if (query.maxBudget !== undefined) request = request.lte('budget_amount', Number(query.maxBudget));
        if (query.dateFrom) request = request.gte('gig_date', query.dateFrom);
        if (query.dateTo) request = request.lte('gig_date', query.dateTo);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async getGigById(id: string): Promise<Gig | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getGigsByIds(ids: string[]): Promise<Gig[]> {
        if (!ids.length) return [];

        const { data = [], error } = await supabaseAdmin.from(this.table).select('*').in('id', ids);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async createGig(employerId: string, input: Partial<Gig>): Promise<Gig> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                employer_id: employerId,
                title: input.title!,
                description: input.description ?? null,
                budget_amount: input.budgetAmount!,
                currency: input.currency ?? 'NGN',
                gig_date: input.gigDate!,
                service_id: input.serviceId ?? null,
                location_name: input.venueName ?? null,
                location_latitude: input.locationLatitude ?? null,
                location_longitude: input.locationLongitude ?? null,
                is_remote: input.isRemote ?? false,
                required_talent_count: input.requiredTalentCount ?? 1,
                status: input.status ?? 'open',
                event_type: input.eventType ?? null,
                start_time: input.startTime ?? null,
                end_time: input.endTime ?? null,
                duration_minutes: input.durationMinutes ?? null,
                equipment_provided: input.equipmentProvided ?? false,
                dress_code: input.dressCode ?? null,
                additional_notes: input.additionalNotes ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Failed to create gig');
        }

        return this.mapToCamelCase(data);
    }

    async updateGigById(id: string, input: Partial<Gig>): Promise<Gig> {
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

    async findStaleOpenGigs(now: Date = new Date()): Promise<Gig[]> {
        const nowIso = now.toISOString();
        const { data = [], error } = await supabaseAdmin.from(this.table).select('*').eq('status', 'open').lt('gig_date', nowIso);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async markGigsExpired(gigIds: string[]): Promise<void> {
        if (!gigIds.length) return;

        const { error } = await supabaseAdmin
            .from(this.table)
            .update({ status: 'expired' as any, updated_at: new Date().toISOString() })
            .in('id', gigIds)
            .eq('status', 'open');

        if (error) throw error;
    }

    async deleteGig(gigId: string): Promise<null> {
        const existingGig = await this.findById(gigId);

        if (!existingGig) throw new BadRequestError('Gig not found');

        const { error } = await supabaseAdmin.from(this.table).delete().eq('id', gigId);

        if (error) throw error;

        return null;
    }

    async findApplicationByGigAndTalent(gigId: string, talentId: string): Promise<GigApplication | null> {
        const { data, error } = await supabaseAdmin.from('gig_applications').select('*').eq('gig_id', gigId).eq('talent_id', talentId).maybeSingle();

        if (error) throw error;

        return data ? this.mapRow<GigApplication>(data as unknown as DatabaseGigApplication) : null;
    }

    async getApplicationsForGig(
        gigId: string,
        query: { page?: number | string; pageSize?: number | string; status?: ApplicationStatusEnum },
    ): Promise<GigApplication[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from('gig_applications').select('*').eq('gig_id', gigId);

        if (query.status) request = request.eq('status', query.status);

        const { data = [], error } = await request.order('applied_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapRow<GigApplication>(row as unknown as DatabaseGigApplication));
    }

    async createApplication(gigId: string, talentId: string, input: Pick<GigApplication, 'coverMessage' | 'proposedRate'>): Promise<GigApplication> {
        const { data, error } = await supabaseAdmin
            .from('gig_applications')
            .insert({
                gig_id: gigId,
                talent_id: talentId,
                cover_message: input.coverMessage ?? null,
                proposed_rate: input.proposedRate ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Failed to create gig application');
        }

        return this.mapRow<GigApplication>(data as unknown as DatabaseGigApplication);
    }

    async updateApplication(applicationId: string, input: Partial<GigApplication>): Promise<GigApplication> {
        const { data, error } = await supabaseAdmin
            .from('gig_applications')
            .update({
                ...this.mapInputToSnakeCase(input as Record<string, unknown>),
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select('*')
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Failed to update gig application');
        }

        return this.mapRow<GigApplication>(data as unknown as DatabaseGigApplication);
    }

    async rejectOtherApplications(gigId: string, selectedTalentId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('gig_applications')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString(),
            })
            .eq('gig_id', gigId)
            .neq('talent_id', selectedTalentId)
            .in('status', ['submitted', 'reviewing', 'shortlisted']);

        if (error) throw error;
    }

    async getTalentGigItems(talentId: string, query: { page?: number | string; pageSize?: number | string }): Promise<TalentGigItem[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        const { data = [], error } = await supabaseAdmin
            .from('gig_applications')
            .select('*, gigs(*)')
            .eq('talent_id', talentId)
            .order('applied_at', { ascending: false })
            .range(offset, rangeEnd);

        if (error) throw error;

        return (data as Array<Record<string, unknown> & { gigs?: Record<string, unknown> | null }>).map((row) => {
            const { gigs, ...applicationRow } = row;

            return {
                application: this.mapRow<GigApplication>(applicationRow),
                gig: gigs ? this.mapRow<Gig>(gigs) : null,
            };
        });
    }
}

const gigRepository = new GigRepository();
export default gigRepository;
