import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { SaveGigDto } from '../../interfaces';
import { GigRepository, SavedGigRepository } from '../../repository';

export class SaveGig {
    constructor(private readonly gigRepository: GigRepository, private readonly savedGigRepository: SavedGigRepository) {}

    handle = async ({ params, request }: ControllerArgs<SaveGigDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const savedGig = await this.savedGigRepository.saveGig(userId, params.id);

        return {
            code: HttpStatus.OK,
            message: 'Gig Saved Successfully',
            data: savedGig,
        };
    };
}

const saveGig = new SaveGig(new GigRepository(), new SavedGigRepository());
export default saveGig;
