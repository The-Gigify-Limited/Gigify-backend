import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { Json } from '@/core/types';
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
                provider: 'manual',
                provider_payload: null,
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

    async getLatestByUserId(userId: string): Promise<IdentityVerification | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getLatestByUserIdAndProvider(userId: string, provider: IdentityVerification['provider']): Promise<IdentityVerification | null> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('user_id', userId)
            .eq('provider', provider)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getByProviderApplicantId(providerApplicantId: string): Promise<IdentityVerification | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('provider_applicant_id', providerApplicantId).maybeSingle();

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

    async createProviderVerification(input: {
        userId: string;
        provider: IdentityVerification['provider'];
        status?: IdentityVerification['status'];
        idType?: IdentityVerification['idType'] | null;
        mediaUrl?: string | null;
        selfieUrl?: string | null;
        notes?: string | null;
        reviewedAt?: string | null;
        providerApplicantId?: string | null;
        providerLevelName?: string | null;
        providerReviewStatus?: string | null;
        providerReviewResult?: string | null;
        providerPayload?: Json | null;
    }): Promise<IdentityVerification> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: input.userId,
                provider: input.provider,
                status: input.status ?? 'pending',
                id_type: input.idType ?? null,
                media_url: input.mediaUrl ?? null,
                selfie_url: input.selfieUrl ?? null,
                notes: input.notes ?? null,
                reviewed_at: input.reviewedAt ?? null,
                provider_applicant_id: input.providerApplicantId ?? null,
                provider_level_name: input.providerLevelName ?? null,
                provider_review_status: input.providerReviewStatus ?? null,
                provider_review_result: input.providerReviewResult ?? null,
                provider_payload: input.providerPayload ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async updateVerification(id: string, input: Partial<IdentityVerification>): Promise<IdentityVerification> {
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

    async review(
        id: string,
        input: Partial<Pick<IdentityVerification, 'status' | 'notes' | 'reviewedAt' | 'providerReviewStatus' | 'providerReviewResult'>>,
    ): Promise<IdentityVerification> {
        return this.updateVerification(id, input);
    }
}

const identityVerificationRepository = new IdentityVerificationRepository();
export default identityVerificationRepository;
