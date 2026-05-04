jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetGigTypes } from './index';

describe('GetGigTypes service', () => {
    it('returns the active gig types from the repository', async () => {
        const gigRepository = {
            getGigTypes: jest.fn().mockResolvedValue([
                { id: 'type-1', name: 'Wedding', isActive: true },
                { id: 'type-2', name: 'Party', isActive: true },
            ]),
        };

        const service = new GetGigTypes(gigRepository as never);

        const response = await service.handle({} as never);

        expect(gigRepository.getGigTypes).toHaveBeenCalledTimes(1);
        expect(response.code).toBe(200);
        expect(response.message).toBe('Gig Types Retrieved Successfully');
        expect(response.data).toHaveLength(2);
        expect(response.data[0].name).toBe('Wedding');
    });

    it('returns an empty array when no gig types are active', async () => {
        const gigRepository = { getGigTypes: jest.fn().mockResolvedValue([]) };
        const service = new GetGigTypes(gigRepository as never);

        const response = await service.handle({} as never);

        expect(response.data).toEqual([]);
    });
});
