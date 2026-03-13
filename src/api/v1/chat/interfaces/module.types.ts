import { DatabaseTable } from '@/core/types';
import { Gig } from '~/gigs/interfaces';
import { User } from '~/user/interfaces';

export type DatabaseConversation = DatabaseTable['conversations']['Row'];
export type DatabaseMessage = DatabaseTable['messages']['Row'];

export type Conversation = {
    id: string;
    gigId: string | null;
    employerId: string;
    talentId: string;
    lastMessageAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Message = {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    attachmentUrl: string | null;
    readAt: string | null;
    createdAt: string;
};

export type ConversationThread = {
    conversation: Conversation;
    counterpart: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl' | 'role' | 'username' | 'email'> | null;
    gig: Pick<Gig, 'id' | 'title' | 'status'> | null;
    lastMessage: Message | null;
    unreadCount: number;
};
