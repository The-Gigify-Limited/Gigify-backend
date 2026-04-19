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

import { ArchiveConversation } from './index';
import { UnarchiveConversation } from '../unarchiveConversation';

describe('Archive/Unarchive conversation services', () => {
    it('archives a conversation when caller has access', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(true),
            archiveConversationForUser: jest.fn().mockResolvedValue(undefined),
        };
        const service = new ArchiveConversation(chatRepository as never);

        await service.handle({
            params: { id: 'conversation-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(chatRepository.archiveConversationForUser).toHaveBeenCalledWith('conversation-1', 'user-1');
    });

    it('refuses to archive when caller is not a participant', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(false),
            archiveConversationForUser: jest.fn(),
        };
        const service = new ArchiveConversation(chatRepository as never);

        await expect(
            service.handle({
                params: { id: 'conversation-1' },
                request: { user: { id: 'stranger' } },
            } as never),
        ).rejects.toThrow('You do not have access to this conversation');

        expect(chatRepository.archiveConversationForUser).not.toHaveBeenCalled();
    });

    it('unarchives a conversation', async () => {
        const chatRepository = {
            hasAccess: jest.fn().mockResolvedValue(true),
            unarchiveConversationForUser: jest.fn().mockResolvedValue(undefined),
        };
        const service = new UnarchiveConversation(chatRepository as never);

        await service.handle({
            params: { id: 'conversation-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(chatRepository.unarchiveConversationForUser).toHaveBeenCalledWith('conversation-1', 'user-1');
    });
});
