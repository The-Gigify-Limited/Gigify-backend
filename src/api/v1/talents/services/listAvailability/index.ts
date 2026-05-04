import { ControllerArgs, HttpStatus } from '@/core';
import { ListAvailabilityDto } from '../../interfaces';
import { AvailabilityRepository } from '../../repository';

export class ListAvailability {
    constructor(private readonly availabilityRepository: AvailabilityRepository) {}

    handle = async ({ params, query }: ControllerArgs<ListAvailabilityDto>) => {
        const availability = await this.availabilityRepository.listForTalent(params.id, {
            from: query?.from,
            to: query?.to,
        });

        return {
            code: HttpStatus.OK,
            message: 'Availability Retrieved Successfully',
            data: availability,
        };
    };
}

const listAvailability = new ListAvailability(new AvailabilityRepository());
export default listAvailability;
