jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('../../repository', () => ({
    AdminRepository: class AdminRepository {},
}));

import { GetAdminDashboard } from './index';

describe('GetAdminDashboard service', () => {
    it('retrieves admin dashboard summary', async () => {
        const adminRepository = {
            getDashboardSummary: jest.fn().mockResolvedValue({
                users: {
                    total: 150,
                    active: 80,
                    suspended: 10,
                    talent: 100,
                    employer: 40,
                    admin: 10,
                },
                gigs: {
                    total: 50,
                    open: 20,
                    inProgress: 15,
                    completed: 10,
                    cancelled: 5,
                },
                operations: {
                    openReports: 5,
                    pendingPayoutRequests: 3,
                    pendingVerifications: 2,
                    pendingPayments: 1,
                },
            }),
        };

        const service = new GetAdminDashboard(adminRepository as never);

        const response = await service.handle({} as never);

        expect(adminRepository.getDashboardSummary).toHaveBeenCalled();
        expect(response.message).toBe('Admin Dashboard Retrieved Successfully');
        expect(response.data.users.total).toBe(150);
        expect(response.data.operations.openReports).toBe(5);
    });

    it('returns dashboard data', async () => {
        const adminRepository = {
            getDashboardSummary: jest.fn().mockResolvedValue({
                users: { total: 0, active: 0, suspended: 0, talent: 0, employer: 0, admin: 0 },
                gigs: { total: 0, open: 0, inProgress: 0, completed: 0, cancelled: 0 },
                operations: { openReports: 0, pendingPayoutRequests: 0, pendingVerifications: 0, pendingPayments: 0 },
            }),
        };

        const service = new GetAdminDashboard(adminRepository as never);

        const response = await service.handle({} as never);

        expect(response.data.users.total).toBe(0);
    });
});
