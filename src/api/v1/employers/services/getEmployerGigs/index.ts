import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { GigRepository } from '~/gigs/repository';

export class GetEmployerGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, query }: ControllerArgs) => {
        if (!params?.id) throw new BadRequestError('Employer ID is required');

        const employerId = params.id;

        const [user] = await dispatch('user:get-by-id', { id: employerId });

        if (!user) throw new RouteNotFoundError('Employer not found');

        const gigs = await this.gigRepository.getAllGigs({
            ...(query ?? {}),
            employerId,
        });

        return {
            code: HttpStatus.OK,
            message: 'Employer Gigs Retrieved Successfully',
            data: gigs,
        };
    };
}

const getEmployerGigs = new GetEmployerGigs(new GigRepository());

export default getEmployerGigs;
