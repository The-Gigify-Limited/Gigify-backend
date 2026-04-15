jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { SearchGigs } from './index';

describe('SearchGigs service', () => {
    it('searches gigs with query parameters', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Web Design Project', category: 'design' }]),
        };

        const service = new SearchGigs(gigRepository as never);

        const response = await service.handle({
            query: { search: 'web design', category: 'design' },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ search: 'web design', category: 'design' });
        expect(response.message).toBe('Gig Search Retrieved Successfully');
        expect(response.data).toHaveLength(1);
    });

    it('returns empty results when no gigs match', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new SearchGigs(gigRepository as never);

        const response = await service.handle({
            query: { search: 'nonexistent' },
        } as never);

        expect(response.data).toEqual([]);
    });
});
