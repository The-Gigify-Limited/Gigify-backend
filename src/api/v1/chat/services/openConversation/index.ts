import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { OpenConversationDto } from '../../interfaces';
import { ChatRepository } from '../../repository';
import { GigRepository } from '~/gigs/repository';
import { UserRepository } from '~/user/repository';

export class OpenConversation {
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly gigRepository: GigRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ input, request }: ControllerArgs<OpenConversationDto>) => {
        const user = request.user;

        if (!user?.id || !user.role) throw new UnAuthorizedError('User not authenticated');
        if (user.role !== 'employer' && user.role !== 'talent') throw new ConflictError('Only employers and talents can start conversations');

        const participantRow = await this.userRepository.findById(input.participantId);

        if (!participantRow) throw new RouteNotFoundError('Conversation participant not found');

        const participant = this.userRepository.mapToCamelCase(participantRow);

        if (participant.id === user.id) throw new BadRequestError('You cannot start a conversation with yourself');
        if (!participant.role || participant.role === user.role) throw new ConflictError('Conversation must be between an employer and a talent');

        const employerId = user.role === 'employer' ? user.id : participant.id;
        const talentId = user.role === 'talent' ? user.id : participant.id;

        if (input.gigId) {
            const gig = await this.gigRepository.getGigById(input.gigId);

            if (!gig) throw new RouteNotFoundError('Gig not found');

            if (gig.employerId !== employerId) {
                throw new ConflictError('This conversation cannot be linked to the selected gig');
            }

            const participantApplication = await this.gigRepository.findApplicationByGigAndTalent(input.gigId, talentId);

            if (!participantApplication) {
                throw new ConflictError('This conversation must be linked to a gig application between the employer and talent');
            }
        }

        const existingConversation = await this.chatRepository.findConversationByContext({
            gigId: input.gigId ?? null,
            employerId,
            talentId,
        });

        const conversation =
            existingConversation ??
            (await this.chatRepository.createConversation({
                gigId: input.gigId ?? null,
                employerId,
                talentId,
            }));

        return {
            code: HttpStatus.OK,
            message: 'Conversation Opened Successfully',
            data: conversation,
        };
    };
}

const openConversation = new OpenConversation(new ChatRepository(), new GigRepository(), new UserRepository());
export default openConversation;
