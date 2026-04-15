jest.mock('@/core', () => {
    class ForbiddenError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        ForbiddenError,
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { GetConversationMessages } from './index';

describe('GetConversationMessages service', () => {
    it('retrieves messages for an authorized user', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(true),
            getConversationMessages: jest.fn().mockResolvedValue([
                {
                    id: 'message-1',
                    body: 'Hello',
                    senderId: 'user-1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'message-2',
                    body: 'Hi there',
                    senderId: 'user-2',
                    createdAt: '2024-01-01T00:01:00Z',
                },
            ]),
        };

        const service = new GetConversationMessages(chatRepository as never);

        const response = await service.handle({
            params: { id: 'conversation-1' },
            query: { limit: 10 },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(chatRepository.hasAccess).toHaveBeenCalledWith('conversation-1', 'user-1');
        expect(chatRepository.getConversationMessages).toHaveBeenCalledWith('conversation-1', { limit: 10 });
        expect(response.message).toBe('Conversation Messages Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('throws when user is not authenticated', async () => {
        const chatRepository = {
            hasAccess: jest.fn(),
            getConversationMessages: jest.fn(),
        };

        const service = new GetConversationMessages(chatRepository as never);

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
            getConversationMessages: jest.fn(),
        };

        const service = new GetConversationMessages(chatRepository as never);

        await expect(
            service.handle({
                params: { id: 'conversation-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('You do not have access to this conversation');
    });
});
