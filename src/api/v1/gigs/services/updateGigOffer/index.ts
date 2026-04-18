import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { dispatch } from '@/app';
import { GigOfferRepository, GigRepository } from '../../repository';
import { UpdateGigOfferDto } from '../../interfaces';

export class UpdateGigOffer {
    constructor(private readonly gigRepository: GigRepository, private readonly gigOfferRepository: GigOfferRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<UpdateGigOfferDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.offerId) throw new BadRequestError('Offer ID is required');

        const offer = await this.gigOfferRepository.getOfferById(params.offerId);

        if (!offer) throw new RouteNotFoundError('Offer not found');
        if (offer.status !== 'pending') throw new ConflictError('This offer can no longer be updated');

        if (offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now()) {
            await this.gigOfferRepository.updateOffer(offer.id, {
                status: 'expired',
                respondedAt: new Date().toISOString(),
            });

            throw new ConflictError('This offer has expired');
        }

        if (input.status === 'withdrawn' && userId !== offer.employerId) {
            throw new ConflictError('Only the employer can withdraw this offer');
        }

        if ((input.status === 'accepted' || input.status === 'declined') && userId !== offer.talentId) {
            throw new ConflictError('Only the recipient can respond to this offer');
        }

        const gig = await this.gigRepository.getGigById(offer.gigId);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        if (input.status === 'withdrawn' || input.status === 'declined') {
            const updatedOffer = await this.gigOfferRepository.updateOffer(offer.id, {
                status: input.status,
                respondedAt: new Date().toISOString(),
            });

            const counterpartId = input.status === 'withdrawn' ? offer.talentId : offer.employerId;
            const title = input.status === 'withdrawn' ? 'Gig offer withdrawn' : 'Gig offer declined';
            const message =
                input.status === 'withdrawn' ? `An offer for "${gig.title}" is no longer available.` : `Your offer for "${gig.title}" was declined.`;

            await Promise.all([
                dispatch('notification:dispatch', {
                    userId: counterpartId,
                    type: 'application_update',
                    title,
                    message,
                    payload: {
                        gigId: gig.id,
                        offerId: updatedOffer.id,
                    },
                    preferenceKey: 'gigUpdates',
                }),
                auditService.log({
                    userId,
                    action: `gig_offer_${input.status}`,
                    resourceType: 'gig_offer',
                    resourceId: updatedOffer.id,
                    changes: {
                        gigId: gig.id,
                        employerId: offer.employerId,
                        talentId: offer.talentId,
                    },
                    ipAddress: request.ip ?? null,
                    userAgent: Array.isArray(request.headers['user-agent'])
                        ? request.headers['user-agent'][0] ?? null
                        : request.headers['user-agent'] ?? null,
                }),
            ]);

            return {
                code: HttpStatus.OK,
                message: 'Gig Offer Updated Successfully',
                data: updatedOffer,
            };
        }

        if (gig.status === 'completed' || gig.status === 'cancelled') {
            throw new ConflictError('This gig can no longer be fulfilled');
        }

        const requiredTalentCount = Math.max(gig.requiredTalentCount ?? 1, 1);
        const alreadyHired = await this.gigRepository.getApplicationsForGig(gig.id, {
            page: 1,
            pageSize: Math.max(requiredTalentCount, 25),
            status: 'hired',
        });

        if (alreadyHired.length >= requiredTalentCount) {
            throw new ConflictError('This gig already has all required talents selected');
        }

        const [existingApplicationResults] = await dispatch('gig:find-application', { gigId: gig.id, talentId: offer.talentId });
        const existingApplication = existingApplicationResults;

        if (existingApplication?.status === 'hired') {
            throw new ConflictError('This offer has already been fulfilled');
        }

        const application = existingApplication
            ? await this.gigRepository.updateApplication(existingApplication.id, {
                  status: 'hired',
                  hiredAt: new Date().toISOString(),
                  proposedRate: offer.proposedRate ?? existingApplication.proposedRate ?? null,
                  employerNotes: offer.message ?? existingApplication.employerNotes ?? null,
              })
            : await (async () => {
                  const createdApplication = await this.gigRepository.createApplication(gig.id, offer.talentId, {
                      proposalMessage: offer.message ?? null,
                      proposedRate: offer.proposedRate ?? null,
                      proposedCurrency: offer.currency ?? null,
                  });

                  return this.gigRepository.updateApplication(createdApplication.id, {
                      status: 'hired',
                      hiredAt: new Date().toISOString(),
                      employerNotes: offer.message ?? null,
                  });
              })();

        const [paymentResults] = await dispatch('earnings:create-record', {
            employerId: offer.employerId,
            talentId: offer.talentId,
            gigId: gig.id,
            amount: offer.proposedRate ?? gig.budgetAmount,
        });
        const payment = paymentResults;

        const shouldCloseHiring = alreadyHired.length + 1 >= requiredTalentCount;
        const nextGigStatus = shouldCloseHiring ? 'in_progress' : gig.status === 'draft' ? 'open' : gig.status ?? 'open';

        const [updatedOffer, updatedGig] = await Promise.all([
            this.gigOfferRepository.updateOffer(offer.id, {
                status: 'accepted',
                respondedAt: new Date().toISOString(),
            }),
            this.gigRepository.updateGigById(gig.id, {
                status: nextGigStatus,
            }),
        ]);

        const expiredOffersPromise = shouldCloseHiring
            ? this.gigOfferRepository.expirePendingOffersForGig(gig.id, offer.talentId)
            : Promise.resolve([]);

        const activitiesAndNotifs: Promise<unknown>[] = [
            shouldCloseHiring ? this.gigRepository.rejectOtherApplications(gig.id, offer.talentId) : Promise.resolve(),
        ];

        if (shouldCloseHiring) {
            activitiesAndNotifs.push(
                dispatch('user:create-activity', {
                    userId: offer.employerId,
                    type: 'gig_started',
                    targetId: gig.id,
                    targetType: 'gig',
                }),
            );
            activitiesAndNotifs.push(
                dispatch('user:create-activity', {
                    userId: offer.talentId,
                    type: 'gig_started',
                    targetId: gig.id,
                    targetType: 'gig',
                }),
            );
        }

        activitiesAndNotifs.push(
            dispatch('notification:dispatch', {
                userId: offer.employerId,
                type: 'application_update',
                title: 'Gig offer accepted',
                message: `Your offer for "${gig.title}" was accepted.`,
                payload: {
                    gigId: gig.id,
                    offerId: updatedOffer.id,
                    applicationId: application.id,
                },
                preferenceKey: 'gigUpdates',
            }),
        );

        activitiesAndNotifs.push(
            auditService.log({
                userId,
                action: 'gig_offer_accepted',
                resourceType: 'gig_offer',
                resourceId: updatedOffer.id,
                changes: {
                    gigId: gig.id,
                    employerId: offer.employerId,
                    talentId: offer.talentId,
                    applicationId: application.id,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent'])
                    ? request.headers['user-agent'][0] ?? null
                    : request.headers['user-agent'] ?? null,
            }),
        );

        activitiesAndNotifs.push(expiredOffersPromise);

        await Promise.all(activitiesAndNotifs);

        return {
            code: HttpStatus.OK,
            message: 'Gig Offer Updated Successfully',
            data: {
                offer: updatedOffer,
                application,
                payment,
                gig: updatedGig,
                remainingTalentSlots: Math.max(requiredTalentCount - (alreadyHired.length + 1), 0),
            },
        };
    };
}

const updateGigOffer = new UpdateGigOffer(new GigRepository(), new GigOfferRepository());

export default updateGigOffer;
