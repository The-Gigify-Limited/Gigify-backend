jest.mock('@/core', () => {
    class ForbiddenError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        ForbiddenError,
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
        realtimeService: {
            broadcastToConversation: jest.fn().mockResolvedValue(undefined),
        },
    };
});

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { MarkConversationRead } from './index';

describe('MarkConversationRead service', () => {
    it('marks a conversation as read for an authorized user', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(true),
            markConversationAsRead: jest.fn().mockResolvedValue(undefined),
        };

        const service = new MarkConversationRead(chatRepository as never);

        const response = await service.handle({
            params: { id: 'conversation-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(chatRepository.hasAccess).toHaveBeenCalledWith('conversation-1', 'user-1');
        expect(chatRepository.markConversationAsRead).toHaveBeenCalledWith('conversation-1', 'user-1');
        expect(response.message).toBe('Conversation Marked as Read Successfully');
    });

    it('throws when user is not authenticated', async () => {
        const chatRepository = {
            hasAccess: jest.fn(),
            markConversationAsRead: jest.fn(),
        };

        const service = new MarkConversationRead(chatRepository as never);

        await expect(
            service.handle({
                params: { id: 'conversation-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');
    });

    it('throws when user does not have access', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(false),
            markConversationAsRead: jest.fn(),
        };

        const service = new MarkConversationRead(chatRepository as never);

        await expect(
            service.handle({
                params: { id: 'conversation-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('You do not have access to this conversation');

        expect(chatRepository.markConversationAsRead).not.toHaveBeenCalled();
    });
});
