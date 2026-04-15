import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { dispatch } from '@/app';
import { ApplyToGigDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class ApplyToGig {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<ApplyToGigDto>) => {
        const talentId = request.user?.id;

        if (!params?.id) throw new BadRequestError('Gig ID is required');
        if (!talentId) throw new UnAuthorizedError('User not authenticated');

        const [gigResults, talentProfileResults, existingApplication] = await Promise.all([
            dispatch('gig:get-by-id', { gigId: params.id }),
            dispatch('talent:get-talent-profile', { user_id: talentId }),
            dispatch('gig:find-application', { gigId: params.id, talentId }),
        ]);

        const gig = gigResults[0];
        const talentProfile = talentProfileResults[0];
        const existingApp = existingApplication[0];

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (!talentProfile) throw new BadRequestError('Talent profile not found');
        if (gig.employerId === talentId) throw new ConflictError('You cannot apply to your own gig');
        if (gig.status !== 'open') throw new ConflictError('Only open gigs can accept applications');
        if (existingApp && existingApp.status !== 'withdrawn') throw new ConflictError('You have already applied to this gig');

        const application = await this.gigRepository.createApplication(params.id, talentId, {
            coverMessage: input.coverMessage ?? null,
            proposedRate: input.proposedRate ?? null,
        });

        await dispatch('user:create-activity', {
            userId: talentId,
            type: 'gig_applied',
            targetId: gig.id,
            targetType: 'gig',
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Gig Application Submitted Successfully',
            data: application,
        };
    };
}

const applyToGig = new ApplyToGig(new GigRepository());

export default applyToGig;
