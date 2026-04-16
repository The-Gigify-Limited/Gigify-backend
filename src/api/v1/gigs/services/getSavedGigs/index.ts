import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { GetSavedGigsDto } from '../../interfaces';
import { GigRepository, SavedGigRepository } from '../../repository';

export class GetSavedGigs {
    constructor(private readonly savedGigRepository: SavedGigRepository, private readonly gigRepository: GigRepository) {}

    handle = async ({ query, request }: ControllerArgs<GetSavedGigsDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const savedGigs = await this.savedGigRepository.getSavedGigsForUser(userId, query ?? {});
        const gigs = await Promise.all(savedGigs.map((savedGig) => this.gigRepository.getGigById(savedGig.gigId)));

        return {
            code: HttpStatus.OK,
            message: 'Saved Gigs Retrieved Successfully',
            data: savedGigs.map((savedGig, index) => ({
                savedGig,
                gig: gigs[index] ?? null,
            })),
        };
    };
}

const getSavedGigs = new GetSavedGigs(new SavedGigRepository(), new GigRepository());
export default getSavedGigs;
