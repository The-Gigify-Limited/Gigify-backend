import { ControllerArgs, ForbiddenError, HttpStatus, UnAuthorizedError, realtimeService } from '@/core';
import { ConversationParamsDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class MarkConversationRead {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ params, request }: ControllerArgs<ConversationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const hasAccess = await this.chatRepository.hasAccess(params.id, userId);

        if (!hasAccess) throw new ForbiddenError('You do not have access to this conversation');

        const readAt = new Date().toISOString();
        await this.chatRepository.markConversationAsRead(params.id, userId);

        // Broadcast to the conversation channel so the counterpart's UI can
        // move message receipts from "delivered" to "read" in realtime
        // without having to poll.
        await realtimeService.broadcastToConversation(params.id, 'read_receipt', {
            userId,
            readAt,
        });

        return {
            code: HttpStatus.OK,
            message: 'Conversation Marked as Read Successfully',
        };
    };
}

const markConversationRead = new MarkConversationRead(new ChatRepository());
export default markConversationRead;
