import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { AddAvailabilityDto } from '../../interfaces';
import { AvailabilityRepository } from '../../repository';

export class AddAvailability {
    constructor(private readonly availabilityRepository: AvailabilityRepository) {}

    handle = async ({ input, request }: ControllerArgs<AddAvailabilityDto>) => {
        const user = request.user;
        if (!user?.id) throw new UnAuthorizedError('User not authenticated');
        if (user.role !== 'talent') throw new ConflictError('Only talents can mark themselves unavailable');

        const from = new Date(input.unavailableFrom);
        const until = new Date(input.unavailableUntil);

        if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
            throw new BadRequestError('Invalid date range');
        }
        if (until <= from) {
            throw new BadRequestError('unavailableUntil must be after unavailableFrom');
        }

        const availability = await this.availabilityRepository.addManual({
            talentUserId: user.id,
            unavailableFrom: from.toISOString(),
            unavailableUntil: until.toISOString(),
            reason: input.reason ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Availability Added Successfully',
            data: availability,
        };
    };
}

const addAvailability = new AddAvailability(new AvailabilityRepository());
export default addAvailability;
