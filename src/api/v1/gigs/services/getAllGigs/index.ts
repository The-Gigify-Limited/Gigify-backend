import { ControllerArgs, HttpStatus } from '@/core';
import { GetGigsQueryDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class GetAllGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ query }: ControllerArgs<GetGigsQueryDto>) => {
        const gigs = await this.gigRepository.getAllGigs(query);

        return {
            code: HttpStatus.OK,
            message: 'Gigs Retrieved Successfully',
            data: gigs,
        };
    };
}

const getAllGigs = new GetAllGigs(new GigRepository());

export default getAllGigs;
