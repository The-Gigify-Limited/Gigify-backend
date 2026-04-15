jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    ReportRepository: class ReportRepository {},
    GigRepository: class GigRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { GetAdminReports } from './index';

describe('GetAdminReports service', () => {
    it('retrieves reports with associated user and gig data', async () => {
        const reportRepository = {
            getReports: jest
                .fn()
                .mockResolvedValue([{ id: 'report-1', reporterId: 'user-1', reportedUserId: 'user-2', gigId: 'gig-1', reason: 'Unprofessional' }]),
        };
        const userRepository = {
            findById: jest
                .fn()
                .mockResolvedValueOnce({ id: 'user-1', email: 'reporter@example.com' })
                .mockResolvedValueOnce({ id: 'user-2', email: 'reported@example.com' }),
            mapToCamelCase: jest.fn().mockImplementation((user) => user),
        };
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Project A',
            }),
        };

        const service = new GetAdminReports(reportRepository as never, userRepository as never, gigRepository as never);

        const response = await service.handle({
            query: { limit: 50 },
        } as never);

        expect(reportRepository.getReports).toHaveBeenCalledWith({ limit: 50 });
        expect(response.message).toBe('Admin Reports Retrieved Successfully');
        expect(response.data[0].reporter).not.toBeNull();
        expect(response.data[0].reportedUser).not.toBeNull();
        expect(response.data[0].gig).not.toBeNull();
    });

    it('handles reports without gig id', async () => {
        const reportRepository = {
            getReports: jest
                .fn()
                .mockResolvedValue([{ id: 'report-1', reporterId: 'user-1', reportedUserId: 'user-2', gigId: null, reason: 'Abuse' }]),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValueOnce({ id: 'user-1' }).mockResolvedValueOnce({ id: 'user-2' }),
            mapToCamelCase: jest.fn().mockImplementation((user) => user),
        };
        const gigRepository = {
            getGigById: jest.fn(),
        };

        const service = new GetAdminReports(reportRepository as never, userRepository as never, gigRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
        expect(response.data[0].gig).toBeNull();
    });

    it('returns empty list when no reports exist', async () => {
        const reportRepository = {
            getReports: jest.fn().mockResolvedValue([]),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };
        const gigRepository = {
            getGigById: jest.fn(),
        };

        const service = new GetAdminReports(reportRepository as never, userRepository as never, gigRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
