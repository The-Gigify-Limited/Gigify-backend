import { ControllerArgs, HttpStatus } from '@/core';
import { GigRepository } from '~/gigs/repository';

export class GetGigTypes {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async (_args: ControllerArgs) => {
        const gigTypes = await this.gigRepository.getGigTypes();

        return {
            code: HttpStatus.OK,
            message: 'Gig Types Retrieved Successfully',
            data: gigTypes,
        };
    };
}

const getGigTypes = new GetGigTypes(new GigRepository());

export default getGigTypes;
