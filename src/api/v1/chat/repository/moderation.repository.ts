import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseMessageReport, DatabaseUserBlock, MessageReport, UserBlock } from '../interfaces';

export class ModerationRepository extends BaseRepository<DatabaseUserBlock, UserBlock> {
    protected readonly table = 'user_blocks';

    async createBlock(input: { blockerId: string; blockedId: string; reason?: string | null }): Promise<UserBlock> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    blocker_id: input.blockerId,
                    blocked_id: input.blockedId,
                    reason: input.reason ?? null,
                },
                { onConflict: 'blocker_id,blocked_id' },
            )
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async removeBlock(blockerId: string, blockedId: string): Promise<void> {
        const { error } = await supabaseAdmin.from(this.table).delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);

        if (error) throw error;
    }

    async listBlocks(blockerId: string): Promise<UserBlock[]> {
        const { data = [], error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('blocker_id', blockerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map((row) => this.mapToCamelCase(row));
    }

    async isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
        const { data = [], error } = await supabaseAdmin
            .from(this.table)
            .select('blocker_id,blocked_id')
            .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
            .limit(1);

        if (error) throw error;

        return (data ?? []).length > 0;
    }
}

export class MessageReportRepository extends BaseRepository<DatabaseMessageReport, MessageReport> {
    protected readonly table = 'message_reports';

    async createReport(input: {
        messageId: string;
        conversationId: string;
        reporterId: string;
        reportedUserId: string;
        reason: string;
        description?: string | null;
    }): Promise<MessageReport> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                message_id: input.messageId,
                conversation_id: input.conversationId,
                reporter_id: input.reporterId,
                reported_user_id: input.reportedUserId,
                reason: input.reason,
                description: input.description ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }
}

const moderationRepository = new ModerationRepository();
export default moderationRepository;
