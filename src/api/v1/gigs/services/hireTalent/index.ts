import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EarningsRepository } from '~/earnings/repository';
import { GigOfferRepository, GigRepository } from '~/gigs/repository';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { ActivityRepository } from '~/user/repository';
import { HireTalentDto } from '../../interfaces';

export class HireTalent {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
        private readonly earningsRepository: EarningsRepository,
        private readonly activityRepository: ActivityRepository,
    ) {}

    handle = async ({ params, input, request }: ControllerArgs<HireTalentDto>) => {
        const employerId = request.user?.id;

        if (!params?.id || !params.talentId) throw new BadRequestError('Gig ID and talent ID are required');
        if (!employerId) throw new UnAuthorizedError('User not authenticated');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (gig.employerId !== employerId) throw new ConflictError('You do not own this gig');
        if (gig.status === 'completed' || gig.status === 'cancelled') throw new ConflictError('This gig can no longer be hired for');

        const existingApplication = await this.gigRepository.findApplicationByGigAndTalent(params.id, params.talentId);

        if (!existingApplication) throw new BadRequestError('Talent has not applied for this gig');
        if (existingApplication.status === 'rejected' || existingApplication.status === 'withdrawn') {
            throw new ConflictError('This application is no longer eligible for hiring');
        }
        if (existingApplication.status === 'hired') {
            throw new ConflictError('This talent has already been hired for the gig');
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

        const [application, updatedGig, payment] = await Promise.all([
            this.gigRepository.updateApplication(existingApplication.id, {
                status: 'hired',
                hiredAt: new Date().toISOString(),
            }),
            this.gigRepository.updateGigById(params.id, {
                status: nextGigStatus,
            }),
            this.earningsRepository.createPayment({
                applicationId: existingApplication.id,
                amount: input.amount ?? gig.budgetAmount,
                currency: input.currency ?? gig.currency ?? 'NGN',
                gigId: params.id,
                paymentReference: input.paymentReference ?? null,
                platformFee: input.platformFee ?? 0,
                provider: input.provider ?? 'manual',
                status: 'pending',
                talentId: params.talentId,
                employerId,
            }),
        ]);

        await Promise.all([
            shouldCloseHiring ? this.gigRepository.rejectOtherApplications(params.id, params.talentId) : Promise.resolve(),
            shouldCloseHiring ? this.gigOfferRepository.expirePendingOffersForGig(params.id, params.talentId) : Promise.resolve(),
            shouldCloseHiring
                ? this.activityRepository.logActivity(employerId, 'gig_started', params.id, {
                      talentId: params.talentId,
                      paymentId: payment.id,
                  })
                : Promise.resolve(),
            shouldCloseHiring
                ? this.activityRepository.logActivity(params.talentId, 'gig_started', params.id, {
                      employerId,
                      paymentId: payment.id,
                  })
                : Promise.resolve(),
            notificationDispatcher.dispatch({
                userId: params.talentId,
                type: 'application_update',
                title: 'You have been hired',
                message: `You were selected for gig "${gig.title}".`,
                payload: {
                    gigId: params.id,
                    applicationId: application.id,
                    paymentId: payment.id,
                },
                preferenceKey: 'gigUpdates',
            }),
        ]);

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

const hireTalent = new HireTalent(new GigRepository(), new GigOfferRepository(), new EarningsRepository(), new ActivityRepository());

export default hireTalent;
