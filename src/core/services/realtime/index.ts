import { supabaseAdmin, SupabaseClient } from '@/core/config';
import { Json } from '@/core/types';

export class RealtimeService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = supabaseAdmin;
    }

    async broadcastToUser(userId: string, event: string, payload: Json): Promise<void> {
        const channel = this.supabase.channel(`user:${userId}`, {
            config: {
                broadcast: {
                    self: false,
                },
            },
        });

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        });
    }

    async broadcastToConversation(conversationId: string, event: string, payload: Json): Promise<void> {
        const channel = this.supabase.channel(`conversation:${conversationId}`, {
            config: {
                broadcast: {
                    self: false,
                },
            },
        });

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        });
    }
}

export const realtimeService = new RealtimeService();
