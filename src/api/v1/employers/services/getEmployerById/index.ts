import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { EmployerRepository } from '~/employers/repository';

export class GetEmployerById {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ params }: ControllerArgs) => {
        if (!params?.id) throw new BadRequestError('Employer ID is required');

        const id = params.id;

        const [user] = await dispatch('user:get-by-id', { id });

        if (!user) throw new RouteNotFoundError('Employer not found');

        const profile = await this.employerRepository.findByUserId(id);

        if (!profile) throw new RouteNotFoundError('Employer not found');

        const totalApplicationsReceived = await this.employerRepository.countTotalApplicationsReceived(id);

        return {
            code: HttpStatus.OK,
            message: 'Employer Retrieved Successfully',
            data: {
                user,
                profile: {
                    ...profile,
                    totalApplicationsReceived,
                },
            },
        };
    };
}

const getEmployerById = new GetEmployerById(new EmployerRepository());

export default getEmployerById;
