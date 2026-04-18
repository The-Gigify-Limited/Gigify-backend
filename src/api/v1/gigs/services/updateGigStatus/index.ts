import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { dispatch } from '@/app';
import { GigOfferRepository, GigRepository } from '~/gigs/repository';
import { UpdateGigStatusDto } from '../../interfaces';

const allowedTransitions: Record<string, string[]> = {
    draft: ['open', 'cancelled'],
    open: ['in_progress', 'cancelled', 'expired', 'draft'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    expired: [],
};

export class UpdateGigStatus {
    constructor(private readonly gigRepository: GigRepository, private readonly gigOfferRepository?: GigOfferRepository) {}

    handle = async ({ params, input }: ControllerArgs<UpdateGigStatusDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const currentStatus = gig.status ?? 'draft';
        const nextStatus = input.status;

        if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
            throw new ConflictError(`Gig cannot move from ${currentStatus} to ${nextStatus}`);
        }

        if (currentStatus === 'open' && nextStatus === 'draft') {
            const offerRepo = this.gigOfferRepository ?? new GigOfferRepository();
            const offerCount = await offerRepo.countOffersForGig(params.id);
            if (offerCount > 0) {
                throw new ConflictError('Cannot revert to draft: offers have already been sent for this gig.');
            }
        }

        const updatedGig = await this.gigRepository.updateGigById(params.id, {
            status: nextStatus,
        });

        const hiredApplications = await this.gigRepository.getApplicationsForGig(params.id, {
            page: 1,
            pageSize: 20,
            status: 'hired',
        });

        const activitiesList: Promise<unknown>[] = [];

        if (nextStatus === 'in_progress') {
            for (const application of hiredApplications) {
                activitiesList.push(
                    dispatch('user:create-activity', {
                        userId: application.talentId,
                        type: 'gig_started',
                        targetId: updatedGig.id,
                        targetType: 'gig',
                    }),
                );
            }
        }

        if (nextStatus === 'completed') {
            for (const application of hiredApplications) {
                activitiesList.push(
                    dispatch('user:create-activity', {
                        userId: application.talentId,
                        type: 'gig_completed',
                        targetId: updatedGig.id,
                        targetType: 'gig',
                    }),
                );
            }
        }

        if (activitiesList.length > 0) {
            await Promise.all(activitiesList);
        }

        return {
            code: HttpStatus.OK,
            message: 'Gig Status Updated Successfully',
            data: updatedGig,
        };
    };
}

const updateGigStatus = new UpdateGigStatus(new GigRepository(), new GigOfferRepository());

export default updateGigStatus;
