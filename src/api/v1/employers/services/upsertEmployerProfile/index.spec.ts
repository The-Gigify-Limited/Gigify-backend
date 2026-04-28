jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

import { BadRequestError } from '@/core';
import { UpsertEmployerProfile } from './index';

describe('UpsertEmployerProfile service', () => {
    it('creates or updates employer profile and surfaces totalApplicationsReceived', async () => {
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
            countTotalApplicationsReceived: jest.fn().mockResolvedValue(12),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            input: {
                organizationName: 'Acme Corp',
                companyWebsite: 'https://acme.com',
                industry: 'Tech',
            },
        } as never);

        expect(employerRepository.upsertEmployerProfile).toHaveBeenCalledWith('user-1', {
            organizationName: 'Acme Corp',
            companyWebsite: 'https://acme.com',
            industry: 'Tech',
        });
        expect(employerRepository.countTotalApplicationsReceived).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Employer Profile Updated Successfully');
        expect(response.data.organizationName).toBe('Acme Corp');
        expect(response.data.industry).toBe('Tech');
        expect(response.data.totalApplicationsReceived).toBe(12);
    });

    it('passes an empty payload through to the repository when input is missing', async () => {
        const employerRepository = {
            upsertEmployerProfile: jest.fn().mockResolvedValue({
                id: 'employer-1',
                userId: 'user-1',
            }),
            countTotalApplicationsReceived: jest.fn().mockResolvedValue(0),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        await service.handle({
            params: { id: 'user-1' },
            input: undefined,
        } as never);

        expect(employerRepository.upsertEmployerProfile).toHaveBeenCalledWith('user-1', {});
    });

    it('throws BadRequestError when the user id is missing from params', async () => {
        const employerRepository = {
            upsertEmployerProfile: jest.fn(),
        };

        const service = new UpsertEmployerProfile(employerRepository as never);

        await expect(
            service.handle({
                params: {},
                input: { organizationName: 'Acme Corp' },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(employerRepository.upsertEmployerProfile).not.toHaveBeenCalled();
    });
});
