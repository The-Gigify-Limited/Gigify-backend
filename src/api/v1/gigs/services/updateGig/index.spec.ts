jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { UpdateGig } from './index';

describe('UpdateGig service', () => {
    it('updates a gig', async () => {
        const gigRepository = {
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Updated Project',
                description: 'Updated description',
            }),
        };

        const service = new UpdateGig(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                title: 'Updated Project',
                description: 'Updated description',
            },
        } as never);

        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', {
            title: 'Updated Project',
            description: 'Updated description',
        });
        expect(response.message).toBe('Gig Updated Successfully');
        expect(response.data.title).toBe('Updated Project');
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            updateGigById: jest.fn(),
        };

        const service = new UpdateGig(gigRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                input: { title: 'Updated' },
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.updateGigById).not.toHaveBeenCalled();
    });
});
