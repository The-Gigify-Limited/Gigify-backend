jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetAdminGigs } from './index';

describe('GetAdminGigs service', () => {
    it('retrieves all gigs with query filters', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([
                { id: 'gig-1', title: 'Project A', status: 'open', employerId: 'emp-1' },
                { id: 'gig-2', title: 'Project B', status: 'in_progress', employerId: 'emp-2' },
            ]),
        };

        const service = new GetAdminGigs(gigRepository as never);

        const response = await service.handle({
            query: { limit: 50, status: 'open' },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ limit: 50, status: 'open' });
        expect(response.message).toBe('Admin Gigs Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('handles empty query', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminGigs(gigRepository as never);

        await service.handle({
            query: undefined,
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({});
    });

    it('returns empty list when no gigs exist', async () => {
        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminGigs(gigRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
