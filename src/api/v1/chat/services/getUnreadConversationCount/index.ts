import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { ChatRepository } from '../../repository';

export class GetUnreadConversationCount {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const unreadCount = await this.chatRepository.getUnreadConversationCount(userId);

        return {
            code: HttpStatus.OK,
            message: 'Unread Conversation Count Retrieved Successfully',
            data: {
                unreadCount,
            },
        };
    };
}

const getUnreadConversationCount = new GetUnreadConversationCount(new ChatRepository());
export default getUnreadConversationCount;
