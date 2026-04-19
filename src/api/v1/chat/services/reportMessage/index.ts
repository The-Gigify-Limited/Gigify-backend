import { BadRequestError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError, supabaseAdmin } from '@/core';
import { ReportMessageDto } from '../../interfaces';
import { ChatRepository, MessageReportRepository } from '../../repository';

export class ReportMessage {
    constructor(private readonly chatRepository: ChatRepository, private readonly messageReportRepository: MessageReportRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<ReportMessageDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');
        const reason = input.reason?.trim();
        if (!reason) throw new BadRequestError('Report reason is required');

        const { data: message, error } = await supabaseAdmin
            .from('messages')
            .select('id, conversation_id, sender_id')
            .eq('id', params.id)
            .maybeSingle();

        if (error) throw error;
        if (!message) throw new RouteNotFoundError('Message not found');

        const hasAccess = await this.chatRepository.hasAccess(message.conversation_id, userId);
        if (!hasAccess) throw new ForbiddenError('You do not have access to this message');

        if (message.sender_id === userId) {
            throw new BadRequestError('You cannot report your own message');
        }

        const report = await this.messageReportRepository.createReport({
            messageId: message.id,
            conversationId: message.conversation_id,
            reporterId: userId,
            reportedUserId: message.sender_id,
            reason,
            description: input.description ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Message Reported Successfully',
            data: report,
        };
    };
}

const reportMessage = new ReportMessage(new ChatRepository(), new MessageReportRepository());
export default reportMessage;
