import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { dispatch } from '@/app';
import { GigRepository } from '~/gigs/repository';
import { CreateGigDto } from '../../interfaces';

export class CreateGig {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ input, request }: ControllerArgs<CreateGigDto>) => {
        const employerId = request.user?.id;

        if (!employerId) throw new UnAuthorizedError('User not authenticated');

        await dispatch('employer:create-profile', { user_id: employerId });

        const gig = await this.gigRepository.createGig(employerId, input);

        await dispatch('user:create-activity', {
            userId: employerId,
            type: 'gig_posted',
            targetId: gig.id,
            targetType: 'gig',
            description: gig.title,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Gig Created Successfully',
            data: gig,
        };
    };
}

const createGig = new CreateGig(new GigRepository());

export default createGig;
