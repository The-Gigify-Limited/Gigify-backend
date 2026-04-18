const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { ExpireStaleGigs } from './index';

describe('ExpireStaleGigs service', () => {
    beforeEach(() => {
        mockDispatch.mockReset().mockResolvedValue([]);
    });

    it('marks every stale open gig expired and dispatches gig:expired for each', async () => {
        const gigRepository = {
            findStaleOpenGigs: jest.fn().mockResolvedValue([
                { id: 'gig-1', employerId: 'employer-1' },
                { id: 'gig-2', employerId: 'employer-2' },
            ]),
            markGigsExpired: jest.fn().mockResolvedValue(undefined),
        };

        const service = new ExpireStaleGigs(gigRepository as never);

        const response = await service.handle();

        expect(gigRepository.findStaleOpenGigs).toHaveBeenCalled();
        expect(gigRepository.markGigsExpired).toHaveBeenCalledWith(['gig-1', 'gig-2']);
        expect(mockDispatch).toHaveBeenCalledWith('gig:expired', { gigId: 'gig-1', employerId: 'employer-1' });
        expect(mockDispatch).toHaveBeenCalledWith('gig:expired', { gigId: 'gig-2', employerId: 'employer-2' });
        expect(response.data).toEqual({ expiredCount: 2, gigIds: ['gig-1', 'gig-2'] });
    });

    it('returns a no-op when there are no stale gigs', async () => {
        const gigRepository = {
            findStaleOpenGigs: jest.fn().mockResolvedValue([]),
            markGigsExpired: jest.fn(),
        };

        const service = new ExpireStaleGigs(gigRepository as never);

        const response = await service.handle();

        expect(gigRepository.markGigsExpired).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(response.data.expiredCount).toBe(0);
    });
});
