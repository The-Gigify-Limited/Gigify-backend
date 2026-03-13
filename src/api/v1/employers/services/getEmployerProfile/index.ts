import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';

export class GetEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const profile = await this.employerRepository.findByUserId(userId);

        if (!profile) throw new RouteNotFoundError('Employer profile not found');

        return {
            code: HttpStatus.OK,
            message: 'Employer Profile Retrieved Successfully',
            data: profile,
        };
    };
}

const getEmployerProfile = new GetEmployerProfile(new EmployerRepository());

export default getEmployerProfile;
