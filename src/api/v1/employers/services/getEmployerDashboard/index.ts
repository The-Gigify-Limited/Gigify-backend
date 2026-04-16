import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';

export class GetEmployerDashboard {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ params, request }: ControllerArgs) => {
        const authUserId = request.user?.id;

        if (!authUserId) throw new UnAuthorizedError('User not authenticated');

        const userId = params?.id ?? authUserId;

        if (userId !== authUserId) throw new BadRequestError('You can only view your own dashboard');

        const dashboard = await this.employerRepository.getEmployerDashboard(userId);

        if (!dashboard) throw new RouteNotFoundError('Employer profile not found');

        return {
            code: HttpStatus.OK,
            message: 'Employer Dashboard Retrieved Successfully',
            data: dashboard,
        };
    };
}

const getEmployerDashboard = new GetEmployerDashboard(new EmployerRepository());

export default getEmployerDashboard;
