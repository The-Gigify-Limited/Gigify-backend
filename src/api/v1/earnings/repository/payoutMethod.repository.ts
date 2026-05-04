import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabasePayoutMethod, PayoutMethod, PayoutMethodProviderEnum } from '../interfaces';

export class PayoutMethodRepository extends BaseRepository<DatabasePayoutMethod, PayoutMethod> {
    protected readonly table = 'payout_methods';

    async listForUser(userId: string): Promise<PayoutMethod[]> {
        const { data = [], error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map((row) => this.mapRow(row as DatabasePayoutMethod));
    }

    async getById(id: string): Promise<PayoutMethod | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();
        if (error) throw error;

        return data ? this.mapRow(data as DatabasePayoutMethod) : null;
    }

    async create(input: {
        userId: string;
        provider: PayoutMethodProviderEnum;
        externalAccountId?: string | null;
        displayLabel?: string | null;
        isVerified?: boolean;
        metadata?: Record<string, unknown> | null;
    }): Promise<PayoutMethod> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: input.userId,
                provider: input.provider,
                external_account_id: input.externalAccountId ?? null,
                display_label: input.displayLabel ?? null,
                is_verified: input.isVerified ?? false,
                metadata: (input.metadata ?? null) as never,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapRow(data as DatabasePayoutMethod);
    }

    async clearDefaultsForUser(userId: string, exceptId?: string): Promise<void> {
        let query = supabaseAdmin.from(this.table).update({ is_default: false }).eq('user_id', userId).eq('is_default', true);
        if (exceptId) query = query.neq('id', exceptId);

        const { error } = await query;
        if (error) throw error;
    }

    async markDefault(id: string): Promise<PayoutMethod> {
        const { data, error } = await supabaseAdmin.from(this.table).update({ is_default: true }).eq('id', id).select('*').single();

        if (error) throw error;

        return this.mapRow(data as DatabasePayoutMethod);
    }

    async deleteById(id: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('id', id);
        if (error) throw error;
    }

    private mapRow(row: DatabasePayoutMethod): PayoutMethod {
        return {
            id: row.id,
            userId: row.user_id,
            provider: row.provider as PayoutMethodProviderEnum,
            externalAccountId: row.external_account_id,
            displayLabel: row.display_label,
            isDefault: Boolean(row.is_default),
            isVerified: Boolean(row.is_verified),
            metadata: row.metadata,
            createdAt: row.created_at,
        };
    }
}

const payoutMethodRepository = new PayoutMethodRepository();
export default payoutMethodRepository;
