jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

import { UpsertEmployerProfile } from './index';

describe('UpsertEmployerProfile service', () => {
    it('creates or updates employer profile', async () => {
        const employerRepository = {
            upsertEmployerProfile: jest.fn().mockResolvedValue({
                id: 'employer-1',
                userId: 'user-1',
                organizationName: 'Acme Corp',
                companyWebsite: 'https://acme.com',
                industry: 'Tech',
                totalGigsPosted: null,
                totalSpent: null,
                updatedAt: new Date().toISOString(),
            }),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            input: {
                organizationName: 'Acme Corp',
                companyWebsite: 'https://acme.com',
            },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(employerRepository.upsertEmployerProfile).toHaveBeenCalledWith('user-1', {
            organizationName: 'Acme Corp',
            companyWebsite: 'https://acme.com',
        });
        expect(response.message).toBe('Employer Profile Updated Successfully');
        expect(response.data.organizationName).toBe('Acme Corp');
    });

    it('handles empty input', async () => {
        const employerRepository = {
            upsertEmployerProfile: jest.fn().mockResolvedValue({
                id: 'employer-1',
                userId: 'user-1',
            }),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        await service.handle({
            params: { id: 'user-1' },
            input: undefined,
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(employerRepository.upsertEmployerProfile).toHaveBeenCalledWith('user-1', {});
    });

    it('throws when user is not authenticated', async () => {
        const employerRepository = {
            upsertEmployerProfile: jest.fn(),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        await expect(
            service.handle({
                input: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(employerRepository.upsertEmployerProfile).not.toHaveBeenCalled();
    });
});
