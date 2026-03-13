import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { UserRepository } from '~/user/repository';
import { CreateGigOfferDto } from '../../interfaces';
import { GigOfferRepository, GigRepository } from '../../repository';

export class CreateGigOffer {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ params, input, request }: ControllerArgs<CreateGigOfferDto>) => {
        const employerId = request.user?.id;

        if (!employerId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const [gig, talentRow, existingPendingOffer, existingApplication] = await Promise.all([
            this.gigRepository.getGigById(params.id),
            this.userRepository.findById(input.talentId),
            this.gigOfferRepository.findPendingOffer(params.id, input.talentId),
            this.gigRepository.findApplicationByGigAndTalent(params.id, input.talentId),
        ]);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (gig.employerId !== employerId) throw new ConflictError('You do not own this gig');
        if (gig.status === 'completed' || gig.status === 'cancelled') throw new ConflictError('This gig can no longer receive offers');
        if (!talentRow) throw new BadRequestError('Talent not found');

        const talent = this.userRepository.mapToCamelCase(talentRow);

        if (talent.role !== 'talent') throw new BadRequestError('Offers can only be sent to talents');
        if (existingPendingOffer) throw new ConflictError('A pending offer already exists for this talent');
        if (existingApplication?.status === 'hired') throw new ConflictError('This talent has already been selected for the gig');

        const alreadyHired = await this.gigRepository.getApplicationsForGig(params.id, {
            page: 1,
            pageSize: Math.max(gig.requiredTalentCount ?? 1, 25),
            status: 'hired',
        });

        if (alreadyHired.length >= Math.max(gig.requiredTalentCount ?? 1, 1)) {
            throw new ConflictError('This gig already has all required talents selected');
        }

        const offer = await this.gigOfferRepository.createOffer({
            gigId: params.id,
            employerId,
            talentId: input.talentId,
            message: input.message ?? null,
            proposedRate: input.proposedRate ?? null,
            currency: input.currency || gig.currency || 'NGN',
            expiresAt: input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        await Promise.all([
            notificationDispatcher.dispatch({
                userId: input.talentId,
                type: 'application_update',
                title: 'New gig offer received',
                message: `You received a direct offer for "${gig.title}".`,
                payload: {
                    gigId: gig.id,
                    offerId: offer.id,
                },
                preferenceKey: 'gigUpdates',
            }),
            auditService.log({
                userId: employerId,
                action: 'gig_offer_created',
                resourceType: 'gig_offer',
                resourceId: offer.id,
                changes: {
                    gigId: params.id,
                    talentId: input.talentId,
                    proposedRate: offer.proposedRate,
                    currency: offer.currency,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
            }),
        ]);

        return {
            code: HttpStatus.CREATED,
            message: 'Gig Offer Created Successfully',
            data: offer,
        };
    };
}

const createGigOffer = new CreateGigOffer(new GigRepository(), new GigOfferRepository(), new UserRepository());

export default createGigOffer;
