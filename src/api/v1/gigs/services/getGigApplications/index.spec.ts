jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetGigApplications } from './index';

describe('GetGigApplications service', () => {
    it('retrieves applications for a gig', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([
                { id: 'app-1', talentId: 'talent-1', status: 'submitted' },
                { id: 'app-2', talentId: 'talent-2', status: 'reviewing' },
            ]),
        };

        const service = new GetGigApplications(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            query: { limit: 10 },
        } as never);

        expect(gigRepository.getGigById).toHaveBeenCalledWith('gig-1');
        expect(gigRepository.getApplicationsForGig).toHaveBeenCalledWith('gig-1', { limit: 10 });
        expect(response.message).toBe('Gig Applications Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
            getApplicationsForGig: jest.fn(),
        };

        const service = new GetGigApplications(gigRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                query: {},
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when gig not found', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue(null),
            getApplicationsForGig: jest.fn(),
        };

        const service = new GetGigApplications(gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                query: {},
            } as never),
        ).rejects.toThrow('Gig not found');

        expect(gigRepository.getApplicationsForGig).not.toHaveBeenCalled();
    });

    it('returns empty list when no applications exist', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
        };

        const service = new GetGigApplications(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
