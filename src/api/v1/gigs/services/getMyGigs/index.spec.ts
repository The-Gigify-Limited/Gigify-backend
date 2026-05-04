jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetMyGigs } from './index';

describe('GetMyGigs service', () => {
    it('filters applied gigs correctly', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1', title: 'Project A' },
                    application: { id: 'app-1', status: 'submitted' },
                },
                {
                    gig: { id: 'gig-2', title: 'Project B' },
                    application: { id: 'app-2', status: 'hired' },
                },
                {
                    gig: { id: 'gig-3', title: 'Project C' },
                    application: { id: 'app-3', status: 'reviewing' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const response = await service.handle({
            params: { status: 'applied' },
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toHaveLength(2);
        expect(response.data[0].application.status).toBe('submitted');
        expect(response.data[1].application.status).toBe('reviewing');
    });

    it('filters active gigs correctly', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1', status: 'in_progress' },
                    application: { id: 'app-1', status: 'hired' },
                },
                {
                    gig: { id: 'gig-2', status: 'completed' },
                    application: { id: 'app-2', status: 'hired' },
                },
                {
                    gig: { id: 'gig-3', status: 'in_progress' },
                    application: { id: 'app-3', status: 'hired' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const response = await service.handle({
            params: { status: 'active' },
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toHaveLength(2);
        expect(response.data.every((item) => item.gig!.status === 'in_progress')).toBe(true);
    });

    it('filters completed gigs correctly', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1', status: 'completed' },
                    application: { id: 'app-1', status: 'hired' },
                },
                {
                    gig: { id: 'gig-2', status: 'cancelled' },
                    application: { id: 'app-2', status: 'hired' },
                },
                {
                    gig: { id: 'gig-3', status: 'in_progress' },
                    application: { id: 'app-3', status: 'hired' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const response = await service.handle({
            params: { status: 'completed' },
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toHaveLength(2);
        expect(['completed', 'cancelled']).toContain(response.data[0].gig!.status);
    });

    it('returns only hired gigs in the open status as upcoming', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1', status: 'open' },
                    application: { id: 'app-1', status: 'hired' },
                },
                {
                    gig: { id: 'gig-2', status: 'in_progress' },
                    application: { id: 'app-2', status: 'hired' },
                },
                {
                    gig: { id: 'gig-3', status: 'completed' },
                    application: { id: 'app-3', status: 'hired' },
                },
                {
                    gig: { id: 'gig-4', status: 'open' },
                    application: { id: 'app-4', status: 'submitted' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const response = await service.handle({
            params: { status: 'upcoming' },
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toHaveLength(1);
        expect(response.data[0].gig!.id).toBe('gig-1');
    });

    it('does not include hired+in_progress gigs in the upcoming bucket', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1', status: 'in_progress' },
                    application: { id: 'app-1', status: 'hired' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const upcoming = await service.handle({
            params: { status: 'upcoming' },
            query: {},
            request: { user: { id: 'talent-1' } },
        } as never);

        const active = await service.handle({
            params: { status: 'active' },
            query: {},
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(upcoming.data).toEqual([]);
        expect(active.data).toHaveLength(1);
        expect(active.data[0].gig!.id).toBe('gig-1');
    });

    it('returns empty list for unknown status', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    gig: { id: 'gig-1' },
                    application: { id: 'app-1', status: 'hired' },
                },
            ]),
        };

        const service = new GetMyGigs(gigRepository as never);

        const response = await service.handle({
            params: { status: 'unknown' },
            query: {},
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.data).toEqual([]);
    });

    it('throws when user is not authenticated', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn(),
        };

        const service = new GetMyGigs(gigRepository as never);

        await expect(
            service.handle({
                params: { status: 'applied' },
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(gigRepository.getTalentGigItems).not.toHaveBeenCalled();
    });

    it('passes query params to repository', async () => {
        const gigRepository = {
            getTalentGigItems: jest.fn().mockResolvedValue([]),
        };

        const service = new GetMyGigs(gigRepository as never);

        await service.handle({
            params: { status: 'applied' },
            query: { limit: 20, offset: 10 },
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(gigRepository.getTalentGigItems).toHaveBeenCalledWith('talent-1', { limit: 20, offset: 10 });
    });
});
