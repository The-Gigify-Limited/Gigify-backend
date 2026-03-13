import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseIdentityVerification, IdentityVerification, SubmitIdentityVerificationInput } from '../interfaces';

export class IdentityVerificationRepository extends BaseRepository<DatabaseIdentityVerification, IdentityVerification> {
    protected readonly table = 'identity_verifications';

    async submit(userId: string, input: SubmitIdentityVerificationInput): Promise<IdentityVerification> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: userId,
                id_type: input.idType,
                media_url: input.mediaUrl,
                selfie_url: input.selfieUrl ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getById(id: string): Promise<IdentityVerification | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getAll(query: {
        page?: number | string;
        pageSize?: number | string;
        status?: IdentityVerification['status'];
    }): Promise<IdentityVerification[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*');

        if (query.status) request = request.eq('status', query.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async review(id: string, input: Partial<Pick<IdentityVerification, 'status' | 'notes' | 'reviewedAt'>>): Promise<IdentityVerification> {
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

const identityVerificationRepository = new IdentityVerificationRepository();
export default identityVerificationRepository;
