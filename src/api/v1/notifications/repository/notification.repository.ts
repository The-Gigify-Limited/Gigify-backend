import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { Json } from '@/core/types';
import { DatabaseNotification, Notification, NotificationChannelEnum, NotificationTypeEnum } from '../interfaces';

export class NotificationRepository extends BaseRepository<DatabaseNotification, Notification> {
    protected readonly table = 'notifications';

    async createNotification(input: {
        userId: string;
        type: NotificationTypeEnum;
        title: string;
        message?: string | null;
        channel?: NotificationChannelEnum;
        payload?: Json;
        sentAt?: string | null;
    }): Promise<Notification> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: input.userId,
                type: input.type,
                title: input.title,
                message: input.message ?? null,
                channel: input.channel ?? 'in_app',
                payload: input.payload ?? {},
                sent_at: input.sentAt ?? new Date().toISOString(),
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async getNotificationsForUser(
        userId: string,
        query: { page?: number | string; pageSize?: number | string; isRead?: boolean },
    ): Promise<Notification[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        let request = supabaseAdmin.from(this.table).select('*').eq('user_id', userId);

        if (typeof query.isRead === 'boolean') {
            request = request.eq('is_read', query.isRead);
        }

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabaseAdmin
            .from(this.table)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        return count ?? 0;
    }

    async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('id', notificationId)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from(this.table)
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    }
}

const notificationRepository = new NotificationRepository();
export default notificationRepository;
