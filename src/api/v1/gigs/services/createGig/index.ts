import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';
import { GigRepository } from '~/gigs/repository';
import { ActivityRepository } from '~/user/repository';
import { CreateGigDto } from '../../interfaces';

export class CreateGig {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly employerRepository: EmployerRepository,
        private readonly activityRepository: ActivityRepository,
    ) {}

    handle = async ({ input, request }: ControllerArgs<CreateGigDto>) => {
        const employerId = request.user?.id;

        if (!employerId) throw new UnAuthorizedError('User not authenticated');

        await this.employerRepository.createEmployerProfile(employerId);

        const gig = await this.gigRepository.createGig(employerId, input);

        await Promise.all([
            this.employerRepository.syncStats(employerId),
            this.activityRepository.logActivity(employerId, 'gig_posted', gig.id, {
                title: gig.title,
            }),
        ]);

        return {
            code: HttpStatus.CREATED,
            message: 'Gig Created Successfully',
            data: gig,
        };
    };
}

const createGig = new CreateGig(new GigRepository(), new EmployerRepository(), new ActivityRepository());

export default createGig;
