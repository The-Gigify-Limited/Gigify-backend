import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { SaveGigDto } from '../../interfaces';
import { SavedGigRepository } from '../../repository';

export class RemoveSavedGig {
    constructor(private readonly savedGigRepository: SavedGigRepository) {}

    handle = async ({ params, request }: ControllerArgs<SaveGigDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        await this.savedGigRepository.removeGig(userId, params.id);

        return {
            code: HttpStatus.OK,
            message: 'Gig Removed from Saved List Successfully',
        };
    };
}

const removeSavedGig = new RemoveSavedGig(new SavedGigRepository());
export default removeSavedGig;
