jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ForbiddenError,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { SendMessage } from './index';

describe('SendMessage service', () => {
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
        };

        const service = new SendMessage(chatRepository as never);

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
        expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'talent-1',
                type: 'message_received',
            }),
        );
        expect(response.message).toBe('Message Sent Successfully');
    });
});
