import { DatabaseEnum, DatabaseTable } from '@/core/types';

export type DatabaseConversation = DatabaseTable['conversations']['Row'];
export type DatabaseConversationArchive = DatabaseTable['conversation_archives']['Row'];
export type DatabaseMessage = DatabaseTable['messages']['Row'];
export type DatabaseUserBlock = DatabaseTable['user_blocks']['Row'];
export type DatabaseMessageReport = DatabaseTable['message_reports']['Row'];
export type MessageReportStatus = DatabaseEnum['message_report_status'];

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
    isArchived: boolean;
};

export type UserBlock = {
    blockerId: string;
    blockedId: string;
    reason: string | null;
    createdAt: string;
};

export type MessageReport = {
    id: string;
    messageId: string;
    conversationId: string;
    reporterId: string;
    reportedUserId: string;
    reason: string;
    description: string | null;
    status: MessageReportStatus;
    resolvedBy: string | null;
    resolvedAt: string | null;
    createdAt: string;
};
