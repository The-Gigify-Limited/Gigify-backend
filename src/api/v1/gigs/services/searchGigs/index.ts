import { ControllerArgs, HttpStatus } from '@/core';
import { GetGigsQueryDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class SearchGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ query }: ControllerArgs<GetGigsQueryDto>) => {
        const gigs = await this.gigRepository.getAllGigs(query);

        return {
            code: HttpStatus.OK,
            message: 'Gig Search Retrieved Successfully',
            data: gigs,
        };
    };
}

const searchGigs = new SearchGigs(new GigRepository());

export default searchGigs;
