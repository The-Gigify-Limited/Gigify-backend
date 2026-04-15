jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetGigCatalog } from './index';

describe('GetGigCatalog service', () => {
    it('retrieves gig catalog', async () => {
        const gigRepository = {
            getCatalog: jest.fn().mockResolvedValue([
                { id: 'cat-1', name: 'Web Development', icon: 'code' },
                { id: 'cat-2', name: 'Design', icon: 'palette' },
            ]),
        };

        const service = new GetGigCatalog(gigRepository as never);

        const response = await service.handle({} as never);

        expect(gigRepository.getCatalog).toHaveBeenCalled();
        expect(response.message).toBe('Gig Catalog Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('returns empty catalog when none exist', async () => {
        const gigRepository = {
            getCatalog: jest.fn().mockResolvedValue([]),
        };

        const service = new GetGigCatalog(gigRepository as never);

        const response = await service.handle({} as never);

        expect(response.data).toEqual([]);
    });
});
