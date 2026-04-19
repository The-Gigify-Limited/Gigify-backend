jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}
    class BaseRepository {}

    return {
        BadRequestError,
        ForbiddenError,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        UnAuthorizedError,
        BaseRepository,
        realtimeService: {
            broadcastToConversation: jest.fn(),
        },
    };
});

jest.mock(
    '@/app',
    () => ({
        dispatch: jest.fn(),
        eventBus: {},
    }),
    { virtual: true },
);

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
    ModerationRepository: class ModerationRepository {},
}));

import { dispatch } from '@/app';
import { SendMessage } from './index';

describe('SendMessage service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sends a message and dispatches a message notification to the recipient', async () => {
        const chatRepository = {
            findConversationById: jest.fn().mockResolvedValue({
                id: 'conversation-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
            }),
            createMessage: jest.fn().mockResolvedValue({
                id: 'message-1',
                conversationId: 'conversation-1',
                senderId: 'employer-1',
                body: 'Hello there',
            }),
            unarchiveConversationForUser: jest.fn().mockResolvedValue(undefined),
        };

        const moderationRepository = {
            isBlockedEitherWay: jest.fn().mockResolvedValue(false),
        };

        (dispatch as jest.Mock).mockResolvedValue([undefined]);

        const service = new SendMessage(chatRepository as never, moderationRepository as never);

        const response = await service.handle({
            params: { id: 'conversation-1' },
            input: {
                body: 'Hello there',
            },
            request: {
                user: { id: 'employer-1' },
            },
        } as never);

        expect(chatRepository.createMessage).toHaveBeenCalledWith({
            conversationId: 'conversation-1',
            senderId: 'employer-1',
            body: 'Hello there',
            attachmentUrl: null,
        });
        expect(dispatch).toHaveBeenCalledWith(
            'notification:dispatch',
            expect.objectContaining({
                userId: 'talent-1',
                type: 'message_received',
            }),
        );
        expect(response.message).toBe('Message Sent Successfully');
    });
});
