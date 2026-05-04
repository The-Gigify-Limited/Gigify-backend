import { ControllerArgs, ForbiddenError, HttpStatus, UnAuthorizedError, realtimeService } from '@/core';
import { TypingIndicatorDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class SendTypingIndicator {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<TypingIndicatorDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const hasAccess = await this.chatRepository.hasAccess(params.id, userId);
        if (!hasAccess) throw new ForbiddenError('You do not have access to this conversation');

        await realtimeService.broadcastToConversation(params.id, 'typing', {
            userId,
            typing: Boolean(input.typing),
            at: new Date().toISOString(),
        });

        return {
            code: HttpStatus.OK,
            message: 'Typing Indicator Sent',
        };
    };
}

const sendTypingIndicator = new SendTypingIndicator(new ChatRepository());
export default sendTypingIndicator;
