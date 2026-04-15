jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { OpenConversation } from './index';
import { dispatch } from '@/app';

describe('OpenConversation service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a new conversation between employer and talent', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn().mockResolvedValue(null),
            createConversation: jest.fn().mockResolvedValue({
                id: 'conversation-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
            }),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }])
            .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'employer-1' }])
            .mockResolvedValueOnce([{ id: 'application-1' }]);

        const service = new OpenConversation(chatRepository as never);

        const response = await service.handle({
            input: {
                participantId: 'talent-1',
                gigId: 'gig-1',
            },
            request: {
                user: { id: 'employer-1', role: 'employer' },
            },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('user:get-by-id', { id: 'talent-1' });
        expect(dispatch).toHaveBeenCalledWith('gig:get-by-id', { gigId: 'gig-1' });
        expect(dispatch).toHaveBeenCalledWith('gig:find-application', { gigId: 'gig-1', talentId: 'talent-1' });
        expect(chatRepository.createConversation).toHaveBeenCalledWith({
            gigId: 'gig-1',
            employerId: 'employer-1',
            talentId: 'talent-1',
        });
        expect(response.message).toBe('Conversation Opened Successfully');
    });

    it('returns existing conversation if one exists', async () => {
        const existingConversation = {
            id: 'conversation-1',
            employerId: 'employer-1',
            talentId: 'talent-1',
            gigId: null,
        };

        const chatRepository = {
            findConversationByContext: jest.fn().mockResolvedValue(existingConversation),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }]);

        const service = new OpenConversation(chatRepository as never);

        const response = await service.handle({
            input: {
                participantId: 'talent-1',
            },
            request: {
                user: { id: 'employer-1', role: 'employer' },
            },
        } as never);

        expect(chatRepository.createConversation).not.toHaveBeenCalled();
        expect(response.data).toEqual(existingConversation);
    });

    it('throws when user is not authenticated', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');
    });

    it('throws when user role is invalid', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1' },
                request: {
                    user: { id: 'user-1', role: 'admin' },
                },
            } as never),
        ).rejects.toThrow('Only employers and talents can start conversations');
    });

    it('throws when participant not found', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([null]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1' },
                request: {
                    user: { id: 'employer-1', role: 'employer' },
                },
            } as never),
        ).rejects.toThrow('Conversation participant not found');
    });

    it('throws when trying to start conversation with self', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'user-1', role: 'talent' }]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'user-1' },
                request: {
                    user: { id: 'user-1', role: 'talent' },
                },
            } as never),
        ).rejects.toThrow('You cannot start a conversation with yourself');
    });

    it('throws when both participants have the same role', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'talent-2', role: 'talent' }]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-2' },
                request: {
                    user: { id: 'talent-1', role: 'talent' },
                },
            } as never),
        ).rejects.toThrow('Conversation must be between an employer and a talent');
    });

    it('throws when gig not found', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }]).mockResolvedValueOnce([null]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1', gigId: 'gig-1' },
                request: {
                    user: { id: 'employer-1', role: 'employer' },
                },
            } as never),
        ).rejects.toThrow('Gig not found');
    });

    it('throws when conversation gig does not belong to employer', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }])
            .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'different-employer' }]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1', gigId: 'gig-1' },
                request: {
                    user: { id: 'employer-1', role: 'employer' },
                },
            } as never),
        ).rejects.toThrow('This conversation cannot be linked to the selected gig');
    });

    it('throws when talent has not applied to the gig', async () => {
        const chatRepository = {
            findConversationByContext: jest.fn(),
            createConversation: jest.fn(),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }])
            .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'employer-1' }])
            .mockResolvedValueOnce([null]);

        const service = new OpenConversation(chatRepository as never);

        await expect(
            service.handle({
                input: { participantId: 'talent-1', gigId: 'gig-1' },
                request: {
                    user: { id: 'employer-1', role: 'employer' },
                },
            } as never),
        ).rejects.toThrow('This conversation must be linked to a gig application between the employer and talent');
    });
});
