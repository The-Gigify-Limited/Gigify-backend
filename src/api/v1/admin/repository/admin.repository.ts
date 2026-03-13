import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseUser, User } from '~/user/interfaces';
import { AdminDashboardSummary, AuditLog, DatabaseAuditLog, UserStatusEnum } from '../interfaces';
import { UserRoleEnum } from '~/user/interfaces';

export class AdminRepository extends BaseRepository<DatabaseUser, User> {
    protected readonly table = 'users';

    private mapAuditLog(row: DatabaseAuditLog): AuditLog {
        return Object.fromEntries(Object.entries(row).map(([key, value]) => [this.toCamelCase(key), value])) as AuditLog;
    }

    async getDashboardSummary(): Promise<AdminDashboardSummary> {
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            talentUsers,
            employerUsers,
            adminUsers,
            totalGigs,
            openGigs,
            inProgressGigs,
            completedGigs,
            cancelledGigs,
            openReports,
            pendingPayoutRequests,
            pendingVerifications,
            pendingPayments,
        ] = await Promise.all([
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'talent'),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
            supabaseAdmin.from('gigs').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('gigs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
            supabaseAdmin.from('gigs').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
            supabaseAdmin.from('gigs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
            supabaseAdmin.from('gigs').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
            supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_review']),
            supabaseAdmin.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
            supabaseAdmin.from('identity_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
        ]);

        return {
            users: {
                total: totalUsers.count ?? 0,
                active: activeUsers.count ?? 0,
                suspended: suspendedUsers.count ?? 0,
                talent: talentUsers.count ?? 0,
                employer: employerUsers.count ?? 0,
                admin: adminUsers.count ?? 0,
            },
            gigs: {
                total: totalGigs.count ?? 0,
                open: openGigs.count ?? 0,
                inProgress: inProgressGigs.count ?? 0,
                completed: completedGigs.count ?? 0,
                cancelled: cancelledGigs.count ?? 0,
            },
            operations: {
                openReports: openReports.count ?? 0,
                pendingPayoutRequests: pendingPayoutRequests.count ?? 0,
                pendingVerifications: pendingVerifications.count ?? 0,
                pendingPayments: pendingPayments.count ?? 0,
            },
        };
    }

    async getUsers(query: {
        page?: number | string;
        pageSize?: number | string;
        role?: UserRoleEnum;
        status?: UserStatusEnum;
        search?: string;
    }): Promise<User[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*');

        if (query.role) request = request.eq('role', query.role);
        if (query.status) request = request.eq('status', query.status);
        if (query.search) {
            const search = `%${query.search}%`;
            request = request.or(`first_name.ilike.${search},last_name.ilike.${search},username.ilike.${search},email.ilike.${search}`);
        }

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async updateUserStatus(userId: string, status: UserStatusEnum): Promise<User> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getAuditLogs(query: {
        page?: number | string;
        pageSize?: number | string;
        userId?: string;
        result?: 'success' | 'failure';
        resourceType?: string;
        action?: string;
    }): Promise<AuditLog[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from('audit_logs').select('*');

        if (query.userId) request = request.eq('user_id', query.userId);
        if (query.result) request = request.eq('result', query.result);
        if (query.resourceType) request = request.eq('resource_type', query.resourceType);
        if (query.action) request = request.ilike('action', `%${query.action}%`);

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapAuditLog(row));
    }
}

const adminRepository = new AdminRepository();
export default adminRepository;
