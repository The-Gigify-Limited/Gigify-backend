import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { TalentRepository } from '~/talents/repository';
import { ActivityRepository } from '~/user/repository';
import { ApplyToGigDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class ApplyToGig {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly talentRepository: TalentRepository,
        private readonly activityRepository: ActivityRepository,
    ) {}

    handle = async ({ params, input, request }: ControllerArgs<ApplyToGigDto>) => {
        const talentId = request.user?.id;

        if (!params?.id) throw new BadRequestError('Gig ID is required');
        if (!talentId) throw new UnAuthorizedError('User not authenticated');

        const [gig, talentProfile, existingApplication] = await Promise.all([
            this.gigRepository.getGigById(params.id),
            this.talentRepository.findByUserId(talentId),
            this.gigRepository.findApplicationByGigAndTalent(params.id, talentId),
        ]);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (!talentProfile) throw new BadRequestError('Talent profile not found');
        if (gig.employerId === talentId) throw new ConflictError('You cannot apply to your own gig');
        if (gig.status !== 'open') throw new ConflictError('Only open gigs can accept applications');
        if (existingApplication && existingApplication.status !== 'withdrawn') throw new ConflictError('You have already applied to this gig');

        const application = await this.gigRepository.createApplication(params.id, talentId, {
            coverMessage: input.coverMessage ?? null,
            proposedRate: input.proposedRate ?? null,
        });

        await this.activityRepository.logActivity(talentId, 'gig_applied', gig.id, {
            applicationId: application.id,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Gig Application Submitted Successfully',
            data: application,
        };
    };
}

const applyToGig = new ApplyToGig(new GigRepository(), new TalentRepository(), new ActivityRepository());

export default applyToGig;
