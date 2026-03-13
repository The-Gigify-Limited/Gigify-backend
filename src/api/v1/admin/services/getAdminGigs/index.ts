import { ControllerArgs, HttpStatus } from '@/core';
import { GigRepository } from '~/gigs/repository';
import { AdminGigsQueryDto } from '../../interfaces';

export class GetAdminGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ query }: ControllerArgs<AdminGigsQueryDto>) => {
        const gigs = await this.gigRepository.getAllGigs(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Admin Gigs Retrieved Successfully',
            data: gigs,
        };
    };
}

const getAdminGigs = new GetAdminGigs(new GigRepository());
export default getAdminGigs;
