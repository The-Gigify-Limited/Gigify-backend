import { BadRequestError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { SendMessageDto } from '../../interfaces';
import { ChatRepository } from '../../repository';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class SendMessage {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<SendMessageDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const conversation = await this.chatRepository.findConversationById(params.id);

        if (!conversation) throw new RouteNotFoundError('Conversation not found');
        if (conversation.employerId !== userId && conversation.talentId !== userId) {
            throw new ForbiddenError('You do not have access to this conversation');
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

        const recipientId = conversation.employerId === userId ? conversation.talentId : conversation.employerId;

        await notificationDispatcher.dispatch({
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
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Message Sent Successfully',
            data: message,
        };
    };
}

const sendMessage = new SendMessage(new ChatRepository());
export default sendMessage;
