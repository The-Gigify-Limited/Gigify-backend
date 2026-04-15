import { DatabaseTable } from '@/core/types';

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

export type Counterpart = {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    role: string | null;
    username: string;
    email: string;
};

export type GigSummary = {
    id: string;
    title: string;
    status: string;
};

export type ConversationThread = {
    conversation: Conversation;
    counterpart: Counterpart | null;
    gig: GigSummary | null;
    lastMessage: Message | null;
    unreadCount: number;
};
