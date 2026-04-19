import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { Json } from '@/core/types';
import { DatabasePayment, DatabasePayoutRequest, EarningsSummary, Payment, PayoutRequest } from '../interfaces';
import { DatabasePaymentReleaseOtp, PaymentReleaseOtp } from '../interfaces';

export class EarningsRepository extends BaseRepository<DatabasePayment, Payment> {
    protected readonly table = 'payments';

    private mapRow<T>(row: Record<string, unknown>): T {
        return Object.fromEntries(Object.entries(row).map(([key, value]) => [this.toCamelCase(key), value])) as T;
    }

    async createPayment(input: {
        employerId: string;
        talentId: string;
        amount: number;
        currency?: string | null;
        gigId?: string | null;
        applicationId?: string | null;
        provider?: Payment['provider'];
        paymentReference?: string | null;
        platformFee?: number;
        status?: Payment['status'];
        metadata?: Json | null;
        paidAt?: string | null;
    }): Promise<Payment> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                employer_id: input.employerId,
                talent_id: input.talentId,
                amount: input.amount,
                currency: input.currency ?? 'NGN',
                gig_id: input.gigId ?? null,
                application_id: input.applicationId ?? null,
                provider: input.provider ?? 'manual',
                payment_reference: input.paymentReference ?? null,
                platform_fee: input.platformFee ?? 0,
                status: input.status ?? 'pending',
                metadata: input.metadata ?? {},
                paid_at: input.paidAt ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getPaymentById(id: string): Promise<Payment | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async getPaymentsForGig(gigId: string): Promise<Payment[]> {
        const { data = [], error } = await supabaseAdmin.from(this.table).select('*').eq('gig_id', gigId).order('created_at', { ascending: true });

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async findPendingPaymentByContext(input: { talentId: string; gigId?: string; applicationId?: string }): Promise<Payment | null> {
        let request = supabaseAdmin.from(this.table).select('*').eq('talent_id', input.talentId).in('status', ['pending', 'processing']);

        if (input.applicationId) request = request.eq('application_id', input.applicationId);
        if (input.gigId) request = request.eq('gig_id', input.gigId);

        const { data, error } = await request.order('created_at', { ascending: false }).limit(1).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async updatePayment(paymentId: string, input: Partial<Payment>): Promise<Payment> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .update({
                ...this.mapToSnakeCase(input),
                updated_at: new Date().toISOString(),
            })
            .eq('id', paymentId)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getPaymentHistoryForTalent(talentId: string, query: { page?: number | string; pageSize?: number | string }): Promise<Payment[]> {
        return this.getPaymentHistoryForUser(talentId, { ...query, direction: 'incoming' });
    }

    async getPaymentHistoryForUser(
        userId: string,
        query: {
            page?: number | string;
            pageSize?: number | string;
            dateFrom?: string;
            dateTo?: string;
            status?: Payment['status'];
            direction?: 'incoming' | 'outgoing';
            gigId?: string;
            paymentIdsFilter?: string[];
        },
    ): Promise<Payment[]> {
        const { offset, rangeEnd } = normalizePagination(query);
        const direction = query.direction ?? 'incoming';

        let request = supabaseAdmin.from(this.table).select('*');

        if (direction === 'outgoing') {
            request = request.eq('employer_id', userId);
        } else {
            request = request.eq('talent_id', userId);
        }

        if (query.gigId) request = request.eq('gig_id', query.gigId);
        if (query.status) request = request.eq('status', query.status);
        if (query.dateFrom) request = request.gte('created_at', query.dateFrom);
        if (query.dateTo) request = request.lte('created_at', query.dateTo);

        // paymentIdsFilter lets the service scope to a pre-computed id set
        // (e.g. the subset currently under open dispute). An empty array means
        // "no matches" — short-circuit to preserve that intent.
        if (query.paymentIdsFilter) {
            if (query.paymentIdsFilter.length === 0) return [];
            request = request.in('id', query.paymentIdsFilter);
        }

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async createPayoutRequest(talentId: string, input: { amount: number; currency?: string; note?: string }): Promise<PayoutRequest> {
        const { data, error } = await supabaseAdmin
            .from('payout_requests')
            .insert({
                talent_id: talentId,
                amount: input.amount,
                currency: input.currency ?? 'NGN',
                note: input.note ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Failed to create payout request');
        }

        return this.mapRow<PayoutRequest>(data as unknown as DatabasePayoutRequest);
    }

    async getPayoutRequestsForTalent(talentId: string): Promise<PayoutRequest[]> {
        const { data = [], error } = await supabaseAdmin
            .from('payout_requests')
            .select('*')
            .eq('talent_id', talentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map((row) => this.mapRow<PayoutRequest>(row as unknown as DatabasePayoutRequest));
    }

    async getPayoutRequestById(id: string): Promise<PayoutRequest | null> {
        const { data, error } = await supabaseAdmin.from('payout_requests').select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapRow<PayoutRequest>(data as unknown as DatabasePayoutRequest) : null;
    }

    async getPayoutRequests(query: {
        page?: number | string;
        pageSize?: number | string;
        status?: PayoutRequest['status'];
    }): Promise<PayoutRequest[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from('payout_requests').select('*');

        if (query.status) request = request.eq('status', query.status);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapRow<PayoutRequest>(row as unknown as DatabasePayoutRequest));
    }

    async updatePayoutRequest(id: string, input: Partial<PayoutRequest>): Promise<PayoutRequest> {
        const payload = Object.fromEntries(
            Object.entries({
                amount: input.amount,
                currency: input.currency,
                note: input.note,
                processed_at: input.processedAt,
                status: input.status,
                talent_id: input.talentId,
                updated_at: new Date().toISOString(),
            }).filter(([, value]) => value !== undefined),
        );

        const { data, error } = await supabaseAdmin
            .from('payout_requests')
            // @ts-expect-error — Object.fromEntries returns { [k: string]: ... } which is too wide for Supabase's strict update types
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapRow<PayoutRequest>(data as unknown as DatabasePayoutRequest);
    }

    async getActivePaymentReleaseOtp(paymentId: string, employerId: string): Promise<PaymentReleaseOtp | null> {
        const { data, error } = await supabaseAdmin
            .from('payment_release_otps')
            .select('*')
            .eq('payment_id', paymentId)
            .eq('employer_id', employerId)
            .is('consumed_at', null)
            .order('created_at', { ascending: false })
            .maybeSingle();

        if (error) throw error;

        return data ? this.mapRow<PaymentReleaseOtp>(data as unknown as DatabasePaymentReleaseOtp) : null;
    }

    async createPaymentReleaseOtp(input: { paymentId: string; employerId: string; codeHash: string; expiresAt: string }): Promise<PaymentReleaseOtp> {
        const { data, error } = await supabaseAdmin
            .from('payment_release_otps')
            .insert({
                payment_id: input.paymentId,
                employer_id: input.employerId,
                code_hash: input.codeHash,
                expires_at: input.expiresAt,
                attempts: 0,
                last_sent_at: new Date().toISOString(),
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapRow<PaymentReleaseOtp>(data as unknown as DatabasePaymentReleaseOtp);
    }

    async updatePaymentReleaseOtp(id: string, input: Partial<PaymentReleaseOtp>): Promise<PaymentReleaseOtp> {
        const { data, error } = await supabaseAdmin
            .from('payment_release_otps')
            // @ts-expect-error — mapToSnakeCase returns Partial<DatabasePayment> which mismatches the payment_release_otps table schema
            .update({
                ...this.mapToSnakeCase(input),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapRow<PaymentReleaseOtp>(data as unknown as DatabasePaymentReleaseOtp);
    }

    async getEarningsSummary(talentId: string): Promise<EarningsSummary> {
        const [payments, payoutRequests] = await Promise.all([
            this.getPaymentHistoryForTalent(talentId, { page: 1, pageSize: 50 }),
            this.getPayoutRequestsForTalent(talentId),
        ]);

        const totalEarned = payments
            .filter((payment) => payment.status === 'paid')
            .reduce((sum, payment) => sum + Number(payment.amount) - Number(payment.platformFee ?? 0), 0);
        const pendingPayments = payments
            .filter((payment) => payment.status === 'pending' || payment.status === 'processing')
            .reduce((sum, payment) => sum + Number(payment.amount) - Number(payment.platformFee ?? 0), 0);
        const totalRequestedPayouts = payoutRequests
            .filter((request) => request.status === 'requested' || request.status === 'approved' || request.status === 'paid')
            .reduce((sum, request) => sum + Number(request.amount), 0);

        return {
            totalEarned,
            pendingPayments,
            availableForPayout: Math.max(totalEarned - totalRequestedPayouts, 0),
            totalRequestedPayouts,
            currency: payments[0]?.currency ?? payoutRequests[0]?.currency ?? 'NGN',
            payments,
            payoutRequests,
        };
    }
}

const earningsRepository = new EarningsRepository();
export default earningsRepository;
