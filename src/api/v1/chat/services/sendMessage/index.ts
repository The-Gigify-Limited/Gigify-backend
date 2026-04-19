import { BadRequestError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError, realtimeService } from '@/core';
import { dispatch } from '@/app';
import { SendMessageDto } from '../../interfaces';
import { ChatRepository, ModerationRepository } from '../../repository';

export class SendMessage {
    constructor(private readonly chatRepository: ChatRepository, private readonly moderationRepository: ModerationRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<SendMessageDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const conversation = await this.chatRepository.findConversationById(params.id);

        if (!conversation) throw new RouteNotFoundError('Conversation not found');
        if (conversation.employerId !== userId && conversation.talentId !== userId) {
            throw new ForbiddenError('You do not have access to this conversation');
        }

        const recipientId = conversation.employerId === userId ? conversation.talentId : conversation.employerId;
        const blocked = await this.moderationRepository.isBlockedEitherWay(userId, recipientId);
        if (blocked) {
            throw new ForbiddenError('You cannot send messages to this user');
        }

        const body = input.body?.trim();
        const attachmentUrl = input.attachmentUrl?.trim() || null;

        if (!body && !attachmentUrl) {
            throw new BadRequestError('Message body or attachment is required');
        }

        const message = await this.chatRepository.createMessage({
            conversationId: conversation.id,
            senderId: userId,
            body: body ?? '',
            attachmentUrl,
        });

        // If the recipient archived this thread, a reply should pop it back to
        // their main inbox — matches standard email/messaging UX and prevents
        // archived threads from going permanently dark.
        await this.chatRepository.unarchiveConversationForUser(conversation.id, recipientId);

        await Promise.all([
            dispatch('notification:dispatch', {
                userId: recipientId,
                type: 'message_received',
                title: 'New message',
                message: body ? body.slice(0, 140) : 'You received a new attachment.',
                payload: {
                    conversationId: conversation.id,
                    messageId: message.id,
                    gigId: conversation.gigId,
                    senderId: userId,
                },
                preferenceKey: 'messageUpdates',
            }),
            realtimeService.broadcastToConversation(conversation.id, 'new_message', message),
        ]);

        return {
            code: HttpStatus.CREATED,
            message: 'Message Sent Successfully',
            data: message,
        };
    };
}

const sendMessage = new SendMessage(new ChatRepository(), new ModerationRepository());
export default sendMessage;
