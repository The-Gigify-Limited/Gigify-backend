import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { GetGigApplicationsDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class GetGigApplications {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, query }: ControllerArgs<GetGigApplicationsDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const applications = await this.gigRepository.getApplicationsForGig(params.id, query);

        return {
            code: HttpStatus.OK,
            message: 'Gig Applications Retrieved Successfully',
            data: applications,
        };
    };
}

const getGigApplications = new GetGigApplications(new GigRepository());

export default getGigApplications;
