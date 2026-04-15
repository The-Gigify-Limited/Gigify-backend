jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    SavedGigRepository: class SavedGigRepository {},
    GigRepository: class GigRepository {},
}));

import { GetSavedGigs } from './index';

describe('GetSavedGigs service', () => {
    it('retrieves saved gigs with corresponding gig details', async () => {
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn().mockResolvedValue([
                { id: 'saved-1', gigId: 'gig-1', userId: 'user-1' },
                { id: 'saved-2', gigId: 'gig-2', userId: 'user-1' },
            ]),
        };
        const gigRepository = {
            getGigById: jest
                .fn()
                .mockResolvedValueOnce({ id: 'gig-1', title: 'Project A' })
                .mockResolvedValueOnce({ id: 'gig-2', title: 'Project B' }),
        };

        const service = new GetSavedGigs(savedGigRepository as never, gigRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(savedGigRepository.getSavedGigsForUser).toHaveBeenCalledWith('user-1', {});
        expect(gigRepository.getGigById).toHaveBeenCalledTimes(2);
        expect(response.message).toBe('Saved Gigs Retrieved Successfully');
        expect(response.data).toHaveLength(2);
        expect(response.data[0].savedGig.gigId).toBe('gig-1');
        expect(response.data[0].gig!.title).toBe('Project A');
    });

    it('returns null for gigs that could not be retrieved', async () => {
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn().mockResolvedValue([
                { id: 'saved-1', gigId: 'gig-1', userId: 'user-1' },
                { id: 'saved-2', gigId: 'gig-2', userId: 'user-1' },
            ]),
        };
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValueOnce({ id: 'gig-1', title: 'Project A' }).mockResolvedValueOnce(null),
        };

        const service = new GetSavedGigs(savedGigRepository as never, gigRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data[0].gig).not.toBeNull();
        expect(response.data[1].gig).toBeNull();
    });

    it('returns empty list when no saved gigs exist', async () => {
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn().mockResolvedValue([]),
        };
        const gigRepository = {
            getGigById: jest.fn(),
        };

        const service = new GetSavedGigs(savedGigRepository as never, gigRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data).toEqual([]);
        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when user is not authenticated', async () => {
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn(),
        };
        const gigRepository = {
            getGigById: jest.fn(),
        };

        const service = new GetSavedGigs(savedGigRepository as never, gigRepository as never);

        await expect(
            service.handle({
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(savedGigRepository.getSavedGigsForUser).not.toHaveBeenCalled();
    });

    it('passes query parameters to repository', async () => {
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn().mockResolvedValue([]),
        };
        const gigRepository = {
            getGigById: jest.fn(),
        };

        const service = new GetSavedGigs(savedGigRepository as never, gigRepository as never);

        await service.handle({
            query: { limit: 20, offset: 10 },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(savedGigRepository.getSavedGigsForUser).toHaveBeenCalledWith('user-1', { limit: 20, offset: 10 });
    });
});
