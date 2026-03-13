import { ControllerArgs, HttpStatus } from '@/core';
import { GigRepository } from '~/gigs/repository';

export class GetGigCatalog {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async (_payload: ControllerArgs) => {
        const catalog = await this.gigRepository.getCatalog();

        return {
            code: HttpStatus.OK,
            message: 'Gig Catalog Retrieved Successfully',
            data: catalog,
        };
    };
}

const getGigCatalog = new GetGigCatalog(new GigRepository());

export default getGigCatalog;
