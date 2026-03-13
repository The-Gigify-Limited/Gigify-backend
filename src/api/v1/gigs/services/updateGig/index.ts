import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { UpdateGigDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class UpdateGig {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, input }: ControllerArgs<UpdateGigDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const updatedGig = await this.gigRepository.updateGigById(params.id, input);

        return {
            code: HttpStatus.OK,
            message: 'Gig Updated Successfully',
            data: updatedGig,
        };
    };
}

const updateGig = new UpdateGig(new GigRepository());

export default updateGig;
