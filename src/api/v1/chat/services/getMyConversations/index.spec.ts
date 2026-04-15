jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
    eventBus: {},
}));

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { GetMyConversations } from './index';

describe('GetMyConversations service', () => {
    it('retrieves all conversations for the authenticated user', async () => {
        const chatRepository = {
            getConversationsForUser: jest.fn().mockResolvedValue([
                {
                    id: 'conversation-1',
                    employerId: 'employer-1',
                    talentId: 'talent-1',
                    gigId: 'gig-1',
                    lastMessageAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'conversation-2',
                    employerId: 'employer-1',
                    talentId: 'talent-2',
                    gigId: null,
                    lastMessageAt: '2024-01-02T00:00:00Z',
                },
            ]),
        };

        const service = new GetMyConversations(chatRepository as never);

        const response = await service.handle({
            query: { limit: 20 },
            request: {
                user: { id: 'employer-1' },
            },
        } as never);

        expect(chatRepository.getConversationsForUser).toHaveBeenCalledWith('employer-1', { limit: 20 }, {});
        expect(response.message).toBe('Conversations Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('returns empty list when no conversations exist', async () => {
        const chatRepository = {
            getConversationsForUser: jest.fn().mockResolvedValue([]),
        };

        const service = new GetMyConversations(chatRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data).toEqual([]);
    });

    it('throws when user is not authenticated', async () => {
        const chatRepository = {
            getConversationsForUser: jest.fn(),
        };

        const service = new GetMyConversations(chatRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');
    });
});
