jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { ExploreGigs } from './index';

describe('ExploreGigs service', () => {
    it('retrieves open gigs by default', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Project A', status: 'open' }]),
        };

        const service = new ExploreGigs(gigRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ status: 'open' });
        expect(response.message).toBe('Gig Explore Feed Retrieved Successfully');
    });

    it('overrides status when provided in query', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Project A', status: 'in_progress' }]),
        };

        const service = new ExploreGigs(gigRepository as never);

        const response = await service.handle({
            query: { status: 'in_progress' },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ status: 'in_progress' });
    });

    it('preserves other query parameters', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new ExploreGigs(gigRepository as never);

        await service.handle({
            query: { limit: 20, category: 'design' },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({
            limit: 20,
            category: 'design',
            status: 'open',
        });
    });

    it('threads discovery filters through to the repository', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new ExploreGigs(gigRepository as never);

        await service.handle({
            query: {
                minBudget: 100000,
                maxBudget: 500000,
                gigType: 'wedding',
                genres: ['DJ', 'Drummer'],
                dateFrom: '2026-05-01',
                dateTo: '2026-06-01',
                latitude: 6.5244,
                longitude: 3.3792,
                radiusKm: 20,
            },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith(
            expect.objectContaining({
                minBudget: 100000,
                maxBudget: 500000,
                gigType: 'wedding',
                genres: ['DJ', 'Drummer'],
                dateFrom: '2026-05-01',
                dateTo: '2026-06-01',
                latitude: 6.5244,
                longitude: 3.3792,
                radiusKm: 20,
                status: 'open',
            }),
        );
    });
});
