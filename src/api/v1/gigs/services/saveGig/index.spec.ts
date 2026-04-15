jest.mock('@/core', () => {
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    GigRepository: class GigRepository {},
    SavedGigRepository: class SavedGigRepository {},
}));

import { SaveGig } from './index';

describe('SaveGig service', () => {
    it('saves a gig for authenticated user', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
            }),
        };
        const savedGigRepository = {
            saveGig: jest.fn().mockResolvedValue({
                id: 'saved-1',
                userId: 'user-1',
                gigId: 'gig-1',
                savedAt: '2024-01-01T00:00:00Z',
            }),
        };

        const service = new SaveGig(gigRepository as never, savedGigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(gigRepository.getGigById).toHaveBeenCalledWith('gig-1');
        expect(savedGigRepository.saveGig).toHaveBeenCalledWith('user-1', 'gig-1');
        expect(response.message).toBe('Gig Saved Successfully');
        expect(response.data.gigId).toBe('gig-1');
    });

    it('throws when user is not authenticated', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
        };
        const savedGigRepository = {
            saveGig: jest.fn(),
        };

        const service = new SaveGig(gigRepository as never, savedGigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when gig not found', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue(null),
        };
        const savedGigRepository = {
            saveGig: jest.fn(),
        };

        const service = new SaveGig(gigRepository as never, savedGigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('Gig not found');

        expect(savedGigRepository.saveGig).not.toHaveBeenCalled();
    });
});
