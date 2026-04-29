import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';

export class GetEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ params, request }: ControllerArgs) => {
        const authUserId = request.user?.id;

        if (!authUserId) throw new UnAuthorizedError('User not authenticated');

        const userId = params?.id ?? authUserId;

        if (userId !== authUserId) throw new BadRequestError('You can only view your own profile');

        const profile = await this.employerRepository.findByUserId(userId);

        if (!profile) throw new RouteNotFoundError('Employer profile not found');

        const totalApplicationsReceived = await this.employerRepository.countTotalApplicationsReceived(userId);

        return {
            code: HttpStatus.OK,
            message: 'Employer Profile Retrieved Successfully',
            data: {
                ...profile,
                totalApplicationsReceived,
            },
        };
    };
}

const getEmployerProfile = new GetEmployerProfile(new EmployerRepository());

export default getEmployerProfile;
