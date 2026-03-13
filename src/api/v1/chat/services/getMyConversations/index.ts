import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { ConversationsQueryDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class GetMyConversations {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ query, request }: ControllerArgs<ConversationsQueryDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const conversations = await this.chatRepository.getConversationsForUser(userId, query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Conversations Retrieved Successfully',
            data: conversations,
        };
    };
}

const getMyConversations = new GetMyConversations(new ChatRepository());
export default getMyConversations;
