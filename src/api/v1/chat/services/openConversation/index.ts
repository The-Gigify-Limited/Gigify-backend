import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { dispatch } from '@/app';
import { OpenConversationDto } from '../../interfaces';
import { ChatRepository } from '../../repository';

export class OpenConversation {
    constructor(private readonly chatRepository: ChatRepository) {}

    handle = async ({ input, request }: ControllerArgs<OpenConversationDto>) => {
        const user = request.user;

        if (!user?.id || !user.role) throw new UnAuthorizedError('User not authenticated');
        if (user.role !== 'employer' && user.role !== 'talent') throw new ConflictError('Only employers and talents can start conversations');

        const [participant] = await dispatch('user:get-by-id', { id: input.participantId });

        if (!participant) throw new RouteNotFoundError('Conversation participant not found');

        if (participant.id === user.id) throw new BadRequestError('You cannot start a conversation with yourself');
        if (!participant.role || participant.role === user.role) throw new ConflictError('Conversation must be between an employer and a talent');

        const employerId = user.role === 'employer' ? user.id : participant.id;
        const talentId = user.role === 'talent' ? user.id : participant.id;

        let gigId: string | null | undefined = undefined;
        if (input.gigId) {
            const [gig] = await dispatch('gig:get-by-id', { gigId: input.gigId });

            if (!gig) throw new RouteNotFoundError('Gig not found');

            if (gig.employerId !== employerId) {
                throw new ConflictError('This conversation cannot be linked to the selected gig');
            }

            const [participantApplication] = await dispatch('gig:find-application', { gigId: input.gigId!, talentId: talentId! });

            if (!participantApplication) {
                throw new ConflictError('This conversation must be linked to a gig application between the employer and talent');
            }

            gigId = input.gigId;
        }

        const existingConversation = await this.chatRepository.findConversationByContext({
            gigId,
            employerId: employerId!,
            talentId: talentId!,
        });

        const conversation =
            existingConversation ??
            (await this.chatRepository.createConversation({
                gigId,
                employerId: employerId!,
                talentId: talentId!,
            }));

        return {
            code: HttpStatus.OK,
            message: 'Conversation Opened Successfully',
            data: conversation,
        };
    };
}

const openConversation = new OpenConversation(new ChatRepository());
export default openConversation;
