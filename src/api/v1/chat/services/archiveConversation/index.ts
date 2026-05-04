import { ControllerArgs, ForbiddenError, HttpStatus, UnAuthorizedError } from '@/core';
import { ConversationParamsDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class ArchiveConversation {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ params, request }: ControllerArgs<ConversationParamsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const hasAccess = await this.chatRepository.hasAccess(params.id, userId);

        if (!hasAccess) throw new ForbiddenError('You do not have access to this conversation');

        await this.chatRepository.archiveConversationForUser(params.id, userId);

        return {
            code: HttpStatus.OK,
            message: 'Conversation Archived Successfully',
        };
    };
}

const archiveConversation = new ArchiveConversation(new ChatRepository());
export default archiveConversation;
