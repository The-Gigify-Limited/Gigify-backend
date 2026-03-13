import { ControllerArgs, HttpStatus } from '@/core';
import { GetGigsQueryDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class ExploreGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ query }: ControllerArgs<GetGigsQueryDto>) => {
        const gigs = await this.gigRepository.getAllGigs({
            ...query,
            status: query.status ?? 'open',
        });

        return {
            code: HttpStatus.OK,
            message: 'Gig Explore Feed Retrieved Successfully',
            data: gigs,
        };
    };
}

const exploreGigs = new ExploreGigs(new GigRepository());

export default exploreGigs;
