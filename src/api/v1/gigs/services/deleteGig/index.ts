import { BadRequestError, ConflictError, ControllerArgs, HttpStatus } from '@/core';
import { GetGigParamsDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class DeleteGig {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params }: ControllerArgs<GetGigParamsDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new BadRequestError('Gig not found');
        if (gig.status === 'in_progress') throw new ConflictError('Active gigs cannot be deleted');

        await this.gigRepository.deleteGig(params.id);

        return {
            code: HttpStatus.NO_CONTENT,
            message: 'Gig Deleted Successfully',
        };
    };
}

const deleteGig = new DeleteGig(new GigRepository());

export default deleteGig;
