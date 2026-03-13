import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseReport, GigReport, ReportStatusEnum } from '../interfaces';

export class ReportRepository extends BaseRepository<DatabaseReport, GigReport> {
    protected readonly table = 'reports';

    async createReport(input: {
        gigId?: string | null;
        reporterId: string;
        reportedUserId: string;
        category?: string | null;
        reason: string;
    }): Promise<GigReport> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                gig_id: input.gigId ?? null,
                reporter_id: input.reporterId,
                reported_user_id: input.reportedUserId,
                category: input.category ?? null,
                reason: input.reason,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async findOpenReport(input: { gigId?: string | null; reporterId: string; reportedUserId: string }): Promise<GigReport | null> {
        let request = supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('reporter_id', input.reporterId)
            .eq('reported_user_id', input.reportedUserId)
            .in('status', ['open', 'in_review']);

        if (input.gigId) {
            request = request.eq('gig_id', input.gigId);
        }

        const { data, error } = await request.order('created_at', { ascending: false }).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getReportById(id: string): Promise<GigReport | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getReports(query: {
        page?: number | string;
        pageSize?: number | string;
        status?: ReportStatusEnum;
        reporterId?: string;
        reportedUserId?: string;
        gigId?: string;
    }): Promise<GigReport[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*');

        if (query.status) request = request.eq('status', query.status);
        if (query.reporterId) request = request.eq('reporter_id', query.reporterId);
        if (query.reportedUserId) request = request.eq('reported_user_id', query.reportedUserId);
        if (query.gigId) request = request.eq('gig_id', query.gigId);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async updateReportById(
        id: string,
        input: Partial<Pick<GigReport, 'status' | 'resolutionNote' | 'reviewedBy' | 'reviewedAt'>>,
    ): Promise<GigReport> {
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
}

const reportRepository = new ReportRepository();
export default reportRepository;
