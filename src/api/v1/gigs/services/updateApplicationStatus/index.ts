import { dispatch } from '@/app';
import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { UpdateApplicationStatusDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

type TargetStatus = 'shortlisted' | 'rejected';

const allowedTransitions: Record<string, TargetStatus[]> = {
    submitted: ['shortlisted', 'rejected'],
    reviewing: ['shortlisted', 'rejected'],
    shortlisted: ['rejected'],
    hired: [],
    rejected: [],
    withdrawn: [],
};

export class UpdateApplicationStatus {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, input }: ControllerArgs<UpdateApplicationStatusDto>) => {
        if (!params?.gigId) throw new BadRequestError('Gig ID is required');
        if (!params?.applicationId) throw new BadRequestError('Application ID is required');

        const [gig, application] = await Promise.all([
            this.gigRepository.getGigById(params.gigId),
            this.gigRepository.getApplicationById(params.applicationId),
        ]);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (!application) throw new RouteNotFoundError('Application not found');

        if (application.gigId !== gig.id) {
            throw new BadRequestError('Application does not belong to this gig');
        }

        const next = input.status;
        const current = application.status;

        if (current === next) {
            throw new ConflictError(`Application is already ${current}`);
        }

        if (!allowedTransitions[current]?.includes(next)) {
            throw new ConflictError(`Cannot move application from ${current} to ${next}`);
        }

        const updates: Partial<typeof application> = { status: next };
        if (input.employerNotes !== undefined) {
            updates.employerNotes = input.employerNotes;
        }

        const updatedApplication = await this.gigRepository.updateApplication(application.id, updates);

        await dispatch(next === 'shortlisted' ? 'gig:application-shortlisted' : 'gig:application-rejected', {
            gigId: gig.id,
            applicationId: updatedApplication.id,
            talentId: updatedApplication.talentId,
            employerId: gig.employerId,
        });

        return {
            code: HttpStatus.OK,
            message: next === 'shortlisted' ? 'Application Shortlisted Successfully' : 'Application Rejected Successfully',
            data: updatedApplication,
        };
    };
}

const updateApplicationStatus = new UpdateApplicationStatus(new GigRepository());

export default updateApplicationStatus;
