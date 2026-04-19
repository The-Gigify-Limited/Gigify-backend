import type { ControllerArgsTypes } from '@/core';

export type ConversationTab = 'all' | 'unread' | 'archived';

export interface ConversationsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        tab?: ConversationTab;
    };
}

export interface OpenConversationDto extends ControllerArgsTypes {
    input: {
        participantId: string;
        gigId?: string;
    };
}

export interface ConversationParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface SendMessageDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        body?: string;
        attachmentUrl?: string | null;
    };
}

export interface BlockUserDto extends ControllerArgsTypes {
    input: {
        userId: string;
        reason?: string | null;
    };
}

export interface UnblockUserDto extends ControllerArgsTypes {
    params: {
        userId: string;
    };
}

export interface ReportMessageDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        reason: string;
        description?: string | null;
    };
}

export interface TypingIndicatorDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        typing: boolean;
    };
}
