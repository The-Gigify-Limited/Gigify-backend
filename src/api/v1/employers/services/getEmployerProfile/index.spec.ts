jest.mock('@/core', () => {
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

import { GetEmployerProfile } from './index';

describe('GetEmployerProfile service', () => {
    it('retrieves employer profile for authenticated user', async () => {
        const employerRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'employer-1',
                userId: 'user-1',
                organizationName: 'Acme Corp',
                companyWebsite: 'https://acme.com',
                industry: 'Tech',
                totalGigsPosted: 5,
                totalSpent: 10000,
                updatedAt: new Date().toISOString(),
            }),
        };

        const service = new GetEmployerProfile(employerRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(employerRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Employer Profile Retrieved Successfully');
        expect(response.data.organizationName).toBe('Acme Corp');
    });

    it('throws when user is not authenticated', async () => {
        const employerRepository = {
            findByUserId: jest.fn(),
        };

        const service = new GetEmployerProfile(employerRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(employerRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when employer profile not found', async () => {
        const employerRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
        };

        const service = new GetEmployerProfile(employerRepository as never);

        await expect(
            service.handle({
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('Employer profile not found');
    });
});
