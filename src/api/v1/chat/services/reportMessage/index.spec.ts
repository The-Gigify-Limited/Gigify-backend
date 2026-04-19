const mockMaybeSingle = jest.fn();

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}
    return {
        BadRequestError,
        ForbiddenError,
        HttpStatus: { CREATED: 201, OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
        supabaseAdmin: {
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: mockMaybeSingle,
                    }),
                }),
            }),
        },
    };
});

jest.mock('../../repository', () => ({
    ChatRepository: class ChatRepository {},
    MessageReportRepository: class MessageReportRepository {},
}));

import { BadRequestError } from '@/core';
import { ReportMessage } from './index';

describe('ReportMessage service', () => {
    beforeEach(() => {
        mockMaybeSingle.mockReset();
    });

    it('creates a message report when reporter has access and is not the sender', async () => {
        mockMaybeSingle.mockResolvedValue({
            data: { id: 'message-1', conversation_id: 'conversation-1', sender_id: 'other-user' },
            error: null,
        });
        const chatRepository = { hasAccess: jest.fn().mockResolvedValue(true) };
        const reportRepository = { createReport: jest.fn().mockResolvedValue({ id: 'report-1' }) };
        const service = new ReportMessage(chatRepository as never, reportRepository as never);

        const response = await service.handle({
            params: { id: 'message-1' },
            input: { reason: 'spam', description: 'unsolicited promo' },
            request: { user: { id: 'reporter-1' } },
        } as never);

        expect(reportRepository.createReport).toHaveBeenCalledWith(
            expect.objectContaining({
                messageId: 'message-1',
                conversationId: 'conversation-1',
                reporterId: 'reporter-1',
                reportedUserId: 'other-user',
                reason: 'spam',
                description: 'unsolicited promo',
            }),
        );
        expect(response.code).toBe(201);
    });

    it('rejects reporting your own message', async () => {
        mockMaybeSingle.mockResolvedValue({
            data: { id: 'message-1', conversation_id: 'conversation-1', sender_id: 'reporter-1' },
            error: null,
        });
        const chatRepository = { hasAccess: jest.fn().mockResolvedValue(true) };
        const reportRepository = { createReport: jest.fn() };
        const service = new ReportMessage(chatRepository as never, reportRepository as never);

        await expect(
            service.handle({
                params: { id: 'message-1' },
                input: { reason: 'spam' },
                request: { user: { id: 'reporter-1' } },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);
    });
});
