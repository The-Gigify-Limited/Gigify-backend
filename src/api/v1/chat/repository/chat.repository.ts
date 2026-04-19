import { AppEventManager } from '@/app/app-events/app.events';
import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import {
    ConversationTab,
    Counterpart,
    DatabaseConversation,
    DatabaseMessage,
    Conversation,
    ConversationThread,
    GigSummary,
    Message,
} from '../interfaces';

export class ChatRepository extends BaseRepository<DatabaseConversation, Conversation> {
    protected readonly table = 'conversations';

    constructor() {
        super();
    }

    async findConversationById(id: string): Promise<Conversation | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('id', id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async findConversationByContext(input: { gigId?: string | null; employerId: string; talentId: string }): Promise<Conversation | null> {
        let request = supabaseAdmin.from(this.table).select('*').eq('employer_id', input.employerId).eq('talent_id', input.talentId);

        if (input.gigId) {
            request = request.eq('gig_id', input.gigId);
        } else {
            request = request.is('gig_id', null);
        }

        const { data, error } = await request.maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async createConversation(input: { gigId?: string | null; employerId: string; talentId: string }): Promise<Conversation> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                gig_id: input.gigId ?? null,
                employer_id: input.employerId,
                talent_id: input.talentId,
                last_message_at: null,
            })
            .select('*')
            .single();

        if (error) throw error;

        return this.mapToCamelCase(data);
    }

    async hasAccess(conversationId: string, userId: string): Promise<boolean> {
        const conversation = await this.findConversationById(conversationId);

        if (!conversation) return false;

        return conversation.employerId === userId || conversation.talentId === userId;
    }

    async getConversationMessages(conversationId: string, query: { page?: number | string; pageSize?: number | string }): Promise<Message[]> {
        const { offset, rangeEnd } = normalizePagination(query);

        const { data = [], error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, rangeEnd);

        if (error) throw error;

        return (data ?? []).map((row) => this.mapMessage(row));
    }

    async createMessage(input: { conversationId: string; senderId: string; body: string; attachmentUrl?: string | null }): Promise<Message> {
        const timestamp = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: input.conversationId,
                sender_id: input.senderId,
                body: input.body,
                attachment_url: input.attachmentUrl ?? null,
                created_at: timestamp,
            })
            .select('*')
            .single();

        if (error) throw error;

        await supabaseAdmin.from(this.table).update({ last_message_at: timestamp, updated_at: timestamp }).eq('id', input.conversationId);

        return this.mapMessage(data);
    }

    async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('messages')
            .update({
                read_at: new Date().toISOString(),
            })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .is('read_at', null);

        if (error) throw error;
    }

    async getUnreadConversationCount(userId: string): Promise<number> {
        const { data: conversations = [], error: conversationError } = await supabaseAdmin
            .from(this.table)
            .select('id')
            .or(`employer_id.eq.${userId},talent_id.eq.${userId}`);

        if (conversationError) throw conversationError;

        const ids = (conversations ?? []).map((conversation) => conversation.id);

        if (ids.length === 0) return 0;

        const { count, error } = await supabaseAdmin
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', ids)
            .neq('sender_id', userId)
            .is('read_at', null);

        if (error) throw error;

        return count ?? 0;
    }

    async getConversationsForUser(
        userId: string,
        query: { page?: number | string; pageSize?: number | string; tab?: ConversationTab },
        appEventManager: AppEventManager,
    ): Promise<ConversationThread[]> {
        const { offset, rangeEnd } = normalizePagination(query);
        const tab: ConversationTab = query.tab ?? 'all';

        const archivedIds = await this.getArchivedConversationIds(userId);

        let request = supabaseAdmin.from(this.table).select('*').or(`employer_id.eq.${userId},talent_id.eq.${userId}`);

        if (tab === 'archived') {
            if (archivedIds.length === 0) return [];
            request = request.in('id', archivedIds);
        } else if (archivedIds.length > 0) {
            request = request.not('id', 'in', `(${archivedIds.join(',')})`);
        }

        const { data = [], error } = await request
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .range(offset, rangeEnd);

        if (error) throw error;

        const conversations = (data ?? []).map((row) => this.mapToCamelCase(row));

        if (conversations.length === 0) return [];

        const conversationIds = conversations.map((conversation) => conversation.id);
        const counterpartIds = Array.from(
            new Set(
                conversations
                    .map((conversation) => (conversation.employerId === userId ? conversation.talentId : conversation.employerId))
                    .filter(Boolean),
            ),
        );
        const gigIds = Array.from(new Set(conversations.map((conversation) => conversation.gigId).filter(Boolean))) as string[];

        const [messageRows, userResults, gigResults] = await Promise.all([
            this.getMessageMetadata(conversationIds, userId),
            Promise.all(counterpartIds.map((id) => appEventManager.dispatch('user:get-by-id', { id }))),
            Promise.all(gigIds.map((id) => appEventManager.dispatch('gig:get-by-id', { gigId: id }))),
        ]);

        const userMap = new Map<string, Counterpart>(
            userResults.filter(Boolean).map((userResultArray) => {
                const user = userResultArray[0] as Counterpart;
                return [user.id, user];
            }),
        );
        const gigMap = new Map<string, GigSummary>(
            gigResults.filter(Boolean).map((gigResultArray) => {
                const gig = gigResultArray[0] as GigSummary;
                return [gig.id, gig];
            }),
        );

        const archivedSet = new Set(archivedIds);
        const threads = conversations.map((conversation) => {
            const counterpartId = conversation.employerId === userId ? conversation.talentId : conversation.employerId;
            const metadata = messageRows.get(conversation.id) ?? { lastMessage: null, unreadCount: 0 };

            return {
                conversation,
                counterpart: userMap.get(counterpartId) ?? null,
                gig: conversation.gigId ? gigMap.get(conversation.gigId) ?? null : null,
                lastMessage: metadata.lastMessage,
                unreadCount: metadata.unreadCount,
                isArchived: archivedSet.has(conversation.id),
            };
        });

        if (tab === 'unread') return threads.filter((thread) => thread.unreadCount > 0);
        return threads;
    }

    async getArchivedConversationIds(userId: string): Promise<string[]> {
        const { data = [], error } = await supabaseAdmin.from('conversation_archives').select('conversation_id').eq('user_id', userId);

        if (error) throw error;

        return (data ?? []).map((row) => row.conversation_id);
    }

    async archiveConversationForUser(conversationId: string, userId: string): Promise<void> {
        const { error } = await supabaseAdmin.from('conversation_archives').upsert(
            {
                conversation_id: conversationId,
                user_id: userId,
                archived_at: new Date().toISOString(),
            },
            { onConflict: 'conversation_id,user_id' },
        );

        if (error) throw error;
    }

    async unarchiveConversationForUser(conversationId: string, userId: string): Promise<void> {
        const { error } = await supabaseAdmin.from('conversation_archives').delete().eq('conversation_id', conversationId).eq('user_id', userId);

        if (error) throw error;
    }

    private async getMessageMetadata(conversationIds: string[], userId: string) {
        const { data = [], error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const metadata = new Map<string, { lastMessage: Message | null; unreadCount: number }>();

        for (const row of data ?? []) {
            const message = this.mapMessage(row);
            const current = metadata.get(message.conversationId) ?? { lastMessage: null, unreadCount: 0 };

            if (!current.lastMessage) {
                current.lastMessage = message;
            }

            if (!message.readAt && message.senderId !== userId) {
                current.unreadCount += 1;
            }

            metadata.set(message.conversationId, current);
        }

        return metadata;
    }

    private mapMessage(row: DatabaseMessage): Message {
        return Object.fromEntries(Object.entries(row).map(([key, value]) => [this.toCamelCase(key), value])) as Message;
    }
}

const chatRepository = new ChatRepository();
export default chatRepository;
