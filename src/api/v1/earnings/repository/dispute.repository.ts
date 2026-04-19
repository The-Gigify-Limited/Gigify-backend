import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination, type PaginationQuery } from '@/core/utils/pagination';
import { DatabaseDispute, DatabaseDisputeEvidence, Dispute, DisputeEvidence, DisputeStatusEnum } from '../interfaces';

export class DisputeRepository extends BaseRepository<DatabaseDispute, Dispute> {
    protected readonly table = 'disputes';

    async createDispute(input: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'resolvedBy' | 'adminNotes'>): Promise<Dispute> {
        const payload = this.mapToSnakeCase({
            paymentId: input.paymentId,
            gigId: input.gigId,
            raisedBy: input.raisedBy,
            reason: input.reason,
            description: input.description,
            status: input.status,
        });

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert(payload as never)
            .select('*')
            .single();
        if (error) throw error;

        return this.mapToCamelCase(data as DatabaseDispute);
    }

    async findForUser(userId: string, options: { pagination?: PaginationQuery; status?: DisputeStatusEnum }): Promise<Dispute[]> {
        const { offset, rangeEnd } = normalizePagination(options.pagination ?? {});

        let request = supabaseAdmin
            .from(this.table)
            .select('*, payments!disputes_payment_id_fkey(employer_id, talent_id)')
            .or(`raised_by.eq.${userId},payments.employer_id.eq.${userId},payments.talent_id.eq.${userId}`);

        if (options.status) request = request.eq('status', options.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);
        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row as DatabaseDispute));
    }

    async listAll(options: { pagination?: PaginationQuery; status?: DisputeStatusEnum }): Promise<Dispute[]> {
        const { offset, rangeEnd } = normalizePagination(options.pagination ?? {});

        let request = supabaseAdmin.from(this.table).select('*');
        if (options.status) request = request.eq('status', options.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);
        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row as DatabaseDispute));
    }

    async getById(id: string): Promise<Dispute | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();
        if (error) throw error;

        return data ? this.mapToCamelCase(data as DatabaseDispute) : null;
    }

    async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute> {
        const payload = this.mapToSnakeCase({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .update(payload as never)
            .eq('id', id)
            .select('*')
            .single();
        if (error) throw error;

        return this.mapToCamelCase(data as DatabaseDispute);
    }

    async addEvidence(input: Omit<DisputeEvidence, 'id' | 'createdAt'>): Promise<DisputeEvidence> {
        const { data, error } = await supabaseAdmin
            .from('dispute_evidence')
            .insert({
                dispute_id: input.disputeId,
                uploaded_by: input.uploadedBy,
                evidence_type: input.evidenceType,
                file_url: input.fileUrl,
                notes: input.notes,
            })
            .select('*')
            .single();
        if (error) throw error;

        return this.mapEvidenceToCamelCase(data as DatabaseDisputeEvidence);
    }

    async listEvidenceForDispute(disputeId: string): Promise<DisputeEvidence[]> {
        const { data = [], error } = await supabaseAdmin
            .from('dispute_evidence')
            .select('*')
            .eq('dispute_id', disputeId)
            .order('created_at', { ascending: true });
        if (error) throw error;

        return (data ?? []).map((row) => this.mapEvidenceToCamelCase(row as DatabaseDisputeEvidence));
    }

    private mapEvidenceToCamelCase(row: DatabaseDisputeEvidence): DisputeEvidence {
        return {
            id: row.id,
            disputeId: row.dispute_id,
            uploadedBy: row.uploaded_by,
            evidenceType: (row.evidence_type ?? null) as DisputeEvidence['evidenceType'],
            fileUrl: row.file_url,
            notes: row.notes,
            createdAt: row.created_at,
        };
    }
}

const disputeRepository = new DisputeRepository();
export default disputeRepository;
