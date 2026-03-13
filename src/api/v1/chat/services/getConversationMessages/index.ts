import { ControllerArgs, ForbiddenError, HttpStatus, UnAuthorizedError } from '@/core';
import { ConversationParamsDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class GetConversationMessages {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ params, query, request }: ControllerArgs<ConversationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const hasAccess = await this.chatRepository.hasAccess(params.id, userId);

        if (!hasAccess) throw new ForbiddenError('You do not have access to this conversation');

        const messages = await this.chatRepository.getConversationMessages(params.id, query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Conversation Messages Retrieved Successfully',
            data: messages,
        };
    };
}

const getConversationMessages = new GetConversationMessages(new ChatRepository());
export default getConversationMessages;
