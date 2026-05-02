jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

import { GetEmployerDashboard } from './index';

describe('GetEmployerDashboard service', () => {
    it('retrieves employer dashboard data', async () => {
        const employerRepository = {
            getEmployerDashboard: jest.fn().mockResolvedValue({
                profile: {
                    id: 'profile-1',
                    userId: 'user-1',
                    organizationName: 'Test Org',
                    companyWebsite: 'https://example.com',
                    industry: 'Tech',
                    totalGigsPosted: 5,
                    totalSpent: 10000,
                    updatedAt: new Date().toISOString(),
                },
                openGigs: 2,
                inProgressGigs: 1,
                completedGigs: 2,
                pendingApplications: 8,
                pendingPayments: 0,
            }),
        };

        const service = new GetEmployerDashboard(employerRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(employerRepository.getEmployerDashboard).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Employer Dashboard Retrieved Successfully');
        expect(response.data.openGigs).toBe(2);
        expect(response.data.inProgressGigs).toBe(1);
    });

    it('throws when user is not authenticated', async () => {
        const employerRepository = {
            getEmployerDashboard: jest.fn(),
        };

        const service = new GetEmployerDashboard(employerRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(employerRepository.getEmployerDashboard).not.toHaveBeenCalled();
    });

    it('throws when employer profile not found', async () => {
        const employerRepository = {
            getEmployerDashboard: jest.fn().mockResolvedValue(null),
        };

        const service = new GetEmployerDashboard(employerRepository as never);

        await expect(
            service.handle({
                params: { id: 'user-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('Employer profile not found');
    });
});
