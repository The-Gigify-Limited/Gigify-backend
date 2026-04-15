jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetAllGigs } from './index';

describe('GetAllGigs service', () => {
    it('retrieves all gigs with query parameters', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([
                { id: 'gig-1', title: 'Project A', status: 'open' },
                { id: 'gig-2', title: 'Project B', status: 'open' },
            ]),
        };

        const service = new GetAllGigs(gigRepository as never);

        const response = await service.handle({
            query: { limit: 20, offset: 0 },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ limit: 20, offset: 0 });
        expect(response.message).toBe('Gigs Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('returns empty list when no gigs exist', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAllGigs(gigRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
