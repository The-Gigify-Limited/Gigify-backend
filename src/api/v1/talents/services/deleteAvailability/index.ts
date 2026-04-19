import { ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { DeleteAvailabilityDto } from '../../interfaces';
import { AvailabilityRepository } from '../../repository';

export class DeleteAvailability {
    constructor(private readonly availabilityRepository: AvailabilityRepository) {}

    handle = async ({ params, request }: ControllerArgs<DeleteAvailabilityDto>) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const row = await this.availabilityRepository.findAvailabilityById(params.id);
        if (!row) throw new RouteNotFoundError('Availability entry not found');

        if (row.talentUserId !== userId) {
            throw new ForbiddenError('You do not own this availability entry');
        }

        // Auto rows mirror the gig schedule — allowing a talent to delete
        // them out-of-band would let a booked talent fake being free for
        // another employer. Auto rows clear only when the underlying gig is
        // cancelled / dispute resolves for employer.
        if (row.source === 'auto_from_gig') {
            throw new ForbiddenError('Auto-generated availability from a booked gig cannot be deleted manually');
        }

        await this.availabilityRepository.deleteById(params.id);

        return {
            code: HttpStatus.OK,
            message: 'Availability Deleted Successfully',
        };
    };
}

const deleteAvailability = new DeleteAvailability(new AvailabilityRepository());
export default deleteAvailability;
