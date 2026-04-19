const mockBroadcast = jest.fn();

jest.mock('@/core', () => {
    class ForbiddenError extends Error {}
    class UnAuthorizedError extends Error {}
    return {
        ForbiddenError,
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
        realtimeService: {
            broadcastToConversation: mockBroadcast,
        },
    };
});

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { SendTypingIndicator } from './index';

describe('SendTypingIndicator service', () => {
    beforeEach(() => {
        mockBroadcast.mockReset().mockResolvedValue(undefined);
    });

    it('broadcasts a typing=true event on the conversation channel', async () => {
        const chatRepository = { hasAccess: jest.fn().mockResolvedValue(true) };
        const service = new SendTypingIndicator(chatRepository as never);

        await service.handle({
            params: { id: 'conversation-1' },
            input: { typing: true },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(mockBroadcast).toHaveBeenCalledWith('conversation-1', 'typing', expect.objectContaining({ userId: 'user-1', typing: true }));
    });

    it('refuses when caller has no access', async () => {
        const chatRepository = { hasAccess: jest.fn().mockResolvedValue(false) };
        const service = new SendTypingIndicator(chatRepository as never);

        await expect(
            service.handle({
                params: { id: 'conversation-1' },
                input: { typing: true },
                request: { user: { id: 'stranger' } },
            } as never),
        ).rejects.toThrow('You do not have access');

        expect(mockBroadcast).not.toHaveBeenCalled();
    });
});
