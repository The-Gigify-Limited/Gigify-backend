jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { GetUnreadConversationCount } from './index';

describe('GetUnreadConversationCount service', () => {
    it('returns unread conversation count for authenticated user', async () => {
        const chatRepository = {
            getUnreadConversationCount: jest.fn().mockResolvedValue(5),
        };

        const service = new GetUnreadConversationCount(chatRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(chatRepository.getUnreadConversationCount).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Unread Conversation Count Retrieved Successfully');
        expect(response.data.unreadCount).toBe(5);
    });

    it('returns zero when no unread conversations', async () => {
        const chatRepository = {
            getUnreadConversationCount: jest.fn().mockResolvedValue(0),
        };

        const service = new GetUnreadConversationCount(chatRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data.unreadCount).toBe(0);
    });

    it('throws when user is not authenticated', async () => {
        const chatRepository = {
            getUnreadConversationCount: jest.fn(),
        };

        const service = new GetUnreadConversationCount(chatRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(chatRepository.getUnreadConversationCount).not.toHaveBeenCalled();
    });
});
