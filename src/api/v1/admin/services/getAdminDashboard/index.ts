import { ControllerArgs, HttpStatus } from '@/core';
import { AdminRepository } from '../../repository';

export class GetAdminDashboard {
    constructor(private readonly adminRepository: AdminRepository) {}

    handle = async (_: ControllerArgs) => {
        const summary = await this.adminRepository.getDashboardSummary();

        return {
            code: HttpStatus.OK,
            message: 'Admin Dashboard Retrieved Successfully',
            data: summary,
        };
    };
}

const getAdminDashboard = new GetAdminDashboard(new AdminRepository());
export default getAdminDashboard;
