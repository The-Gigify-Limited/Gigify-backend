jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { NO_CONTENT: 204 },
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { DeleteGig } from './index';

describe('DeleteGig service', () => {
    it('deletes a gig', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
                status: 'open',
            }),
            deleteGig: jest.fn().mockResolvedValue(undefined),
        };

        const service = new DeleteGig(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
        } as never);

        expect(gigRepository.getGigById).toHaveBeenCalledWith('gig-1');
        expect(gigRepository.deleteGig).toHaveBeenCalledWith('gig-1');
        expect(response.message).toBe('Gig Deleted Successfully');
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
            deleteGig: jest.fn(),
        };

        const service = new DeleteGig(gigRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when gig not found', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue(null),
            deleteGig: jest.fn(),
        };

        const service = new DeleteGig(gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
            } as never),
        ).rejects.toThrow('Gig not found');

        expect(gigRepository.deleteGig).not.toHaveBeenCalled();
    });

    it('throws when gig is in progress', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
                status: 'in_progress',
            }),
            deleteGig: jest.fn(),
        };

        const service = new DeleteGig(gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
            } as never),
        ).rejects.toThrow('Active gigs cannot be deleted');

        expect(gigRepository.deleteGig).not.toHaveBeenCalled();
    });
});
