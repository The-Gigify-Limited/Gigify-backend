import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';

export class GetEmployerDashboard {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

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
