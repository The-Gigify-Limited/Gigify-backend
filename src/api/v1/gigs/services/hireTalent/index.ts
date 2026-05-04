import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { dispatch } from '@/app';
import { GigOfferRepository, GigRepository } from '~/gigs/repository';
import { HireTalentDto } from '../../interfaces';

export class HireTalent {
    constructor(private readonly gigRepository: GigRepository, private readonly gigOfferRepository: GigOfferRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<HireTalentDto>) => {
        const employerId = request.user?.id;

        if (!params?.id || !params.talentId) throw new BadRequestError('Gig ID and talent ID are required');
        if (!employerId) throw new UnAuthorizedError('User not authenticated');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (gig.employerId !== employerId) throw new ConflictError('You do not own this gig');
        if (gig.status === 'completed' || gig.status === 'cancelled') throw new ConflictError('This gig can no longer be hired for');

        const [existingApplicationResults] = await dispatch('gig:find-application', { gigId: params.id, talentId: params.talentId });
        const existingApplication = existingApplicationResults;

        if (!existingApplication) throw new BadRequestError('Talent has not applied for this gig');
        if (existingApplication.status === 'rejected' || existingApplication.status === 'withdrawn') {
            throw new ConflictError('This application is no longer eligible for hiring');
        }
        if (existingApplication.status === 'hired') {
            throw new ConflictError('This talent has already been hired for the gig');
        }

        // If an offer was sent for this gig + talent, require it to have been
        // accepted before direct hire proceeds. Talent who were never offered
        // (direct application -> hire path) can still be hired directly.
        const latestOffer = await this.gigOfferRepository.findLatestOfferForGigAndTalent(params.id, params.talentId);
        if (latestOffer && latestOffer.status !== 'accepted') {
            throw new ConflictError(`Cannot hire talent while their offer is ${latestOffer.status}; the offer must be accepted first.`);
        }

        const alreadyHired = await this.gigRepository.getApplicationsForGig(params.id, {
            page: 1,
            pageSize: Math.max(gig.requiredTalentCount ?? 1, 25),
            status: 'hired',
        });

        const requiredTalentCount = Math.max(gig.requiredTalentCount ?? 1, 1);

        if (alreadyHired.length >= requiredTalentCount) {
            throw new ConflictError('This gig already has all required talents selected');
        }

        const shouldCloseHiring = alreadyHired.length + 1 >= requiredTalentCount;
        const nextGigStatus = shouldCloseHiring ? 'in_progress' : gig.status === 'draft' ? 'open' : gig.status ?? 'open';

        const [application, updatedGig] = await Promise.all([
            this.gigRepository.updateApplication(existingApplication.id, {
                status: 'hired',
                hiredAt: new Date().toISOString(),
            }),
            this.gigRepository.updateGigById(params.id, {
                status: nextGigStatus,
            }),
        ]);

        const [paymentResults] = await dispatch('earnings:create-record', {
            employerId,
            talentId: params.talentId,
            gigId: params.id,
            amount: input.amount ?? gig.budgetAmount,
        });
        const payment = paymentResults;

        const activitiesAndNotifications: Promise<unknown>[] = [
            shouldCloseHiring ? this.gigRepository.rejectOtherApplications(params.id, params.talentId) : Promise.resolve(),
            shouldCloseHiring ? this.gigOfferRepository.expirePendingOffersForGig(params.id, params.talentId) : Promise.resolve(),
        ];

        if (shouldCloseHiring) {
            activitiesAndNotifications.push(
                dispatch('user:create-activity', {
                    userId: employerId,
                    type: 'gig_started',
                    targetId: params.id,
                    targetType: 'gig',
                }),
            );
            activitiesAndNotifications.push(
                dispatch('user:create-activity', {
                    userId: params.talentId,
                    type: 'gig_started',
                    targetId: params.id,
                    targetType: 'gig',
                }),
            );
        }

        activitiesAndNotifications.push(
            dispatch('notification:dispatch', {
                userId: params.talentId,
                type: 'application_update',
                title: 'You have been hired',
                message: `You were selected for gig "${gig.title}".`,
                payload: {
                    gigId: params.id,
                    applicationId: application.id,
                },
                preferenceKey: 'gigUpdates',
            }),
        );

        await Promise.all(activitiesAndNotifications);

        return {
            code: HttpStatus.OK,
            message: 'Talent Hired Successfully',
            data: {
                application,
                gig: updatedGig,
                payment,
                remainingTalentSlots: Math.max(requiredTalentCount - (alreadyHired.length + 1), 0),
            },
        };
    };
}

const hireTalent = new HireTalent(new GigRepository(), new GigOfferRepository());

export default hireTalent;
