import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseEmployerProfile, EmployerDashboard, EmployerProfile } from '../interfaces';

export class EmployerRepository extends BaseRepository<DatabaseEmployerProfile, EmployerProfile> {
    protected readonly table = 'employer_profiles';

    async findByUserId(userId: string): Promise<EmployerProfile | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', userId).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async createEmployerProfile(userId: string): Promise<EmployerProfile> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id: userId,
                },
                {
                    onConflict: 'user_id',
                },
            )
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async upsertEmployerProfile(userId: string, input: Partial<EmployerProfile>): Promise<EmployerProfile> {
        const payload = this.mapToSnakeCase({
            ...input,
            updatedAt: new Date().toISOString(),
        });

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id: userId,
                    ...payload,
                },
                {
                    onConflict: 'user_id',
                },
            )
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getEmployerDashboard(userId: string): Promise<EmployerDashboard | null> {
        const profile = await this.findByUserId(userId);

        if (!profile) return null;

        const [{ count: openGigs }, { count: inProgressGigs }, { count: completedGigs }, { count: pendingApplications }, { count: pendingPayments }] =
            await Promise.all([
                supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).eq('employer_id', userId).eq('status', 'open'),
                supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).eq('employer_id', userId).eq('status', 'in_progress'),
                supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).eq('employer_id', userId).eq('status', 'completed'),
                supabaseAdmin
                    .from('gig_applications')
                    .select('id, gigs!inner(employer_id)', { count: 'exact', head: true })
                    .eq('gigs.employer_id', userId)
                    .in('status', ['submitted', 'reviewing', 'shortlisted']),
                supabaseAdmin.from('payments').select('*', { count: 'exact', head: true }).eq('employer_id', userId).in('status', ['pending', 'processing']),
            ]);

        return {
            profile,
            openGigs: openGigs ?? 0,
            inProgressGigs: inProgressGigs ?? 0,
            completedGigs: completedGigs ?? 0,
            pendingApplications: pendingApplications ?? 0,
            pendingPayments: pendingPayments ?? 0,
        };
    }

    async syncStats(userId: string): Promise<EmployerProfile | null> {
        const existingProfile = await this.findByUserId(userId);

        if (!existingProfile) return null;

        const [{ count: totalGigsPosted }, { data: payments = [] }] = await Promise.all([
            supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).eq('employer_id', userId),
            supabaseAdmin.from('payments').select('amount').eq('employer_id', userId).eq('status', 'paid'),
        ]);

        const totalSpent = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

        return this.upsertEmployerProfile(userId, {
            totalGigsPosted: totalGigsPosted ?? 0,
            totalSpent,
        });
    }
}

const employerRepository = new EmployerRepository();
export default employerRepository;
