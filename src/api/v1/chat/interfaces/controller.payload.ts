import type { ControllerArgsTypes } from '@/core';

export interface ConversationsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
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
