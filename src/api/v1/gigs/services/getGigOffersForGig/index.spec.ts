jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
    GigOfferRepository: class GigOfferRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { GetGigOffersForGig } from './index';

describe('GetGigOffersForGig service', () => {
    it('retrieves offers with associated user details', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
            }),
        };
        const gigOfferRepository = {
            getOffersForGig: jest.fn().mockResolvedValue([
                { id: 'offer-1', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-1', status: 'pending' },
                { id: 'offer-2', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-2', status: 'pending' },
            ]),
        };
        const userRepository = {
            findById: jest
                .fn()
                .mockResolvedValueOnce({ id: 'emp-1', name: 'Employer' })
                .mockResolvedValueOnce({ id: 'tal-1', name: 'Talent 1' })
                .mockResolvedValueOnce({ id: 'tal-2', name: 'Talent 2' }),
            mapToCamelCase: jest.fn().mockImplementation((user) => user),
        };

        const service = new GetGigOffersForGig(gigRepository as never, gigOfferRepository as never, userRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            query: { limit: 10 },
        } as never);

        expect(gigRepository.getGigById).toHaveBeenCalledWith('gig-1');
        expect(gigOfferRepository.getOffersForGig).toHaveBeenCalledWith('gig-1', { limit: 10 });
        expect(response.message).toBe('Gig Offers Retrieved Successfully');
        expect(response.data).toHaveLength(2);
        expect(response.data[0].employer).not.toBeNull();
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
        };
        const gigOfferRepository = {
            getOffersForGig: jest.fn(),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetGigOffersForGig(gigRepository as never, gigOfferRepository as never, userRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                query: {},
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when gig not found', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue(null),
        };
        const gigOfferRepository = {
            getOffersForGig: jest.fn(),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetGigOffersForGig(gigRepository as never, gigOfferRepository as never, userRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                query: {},
            } as never),
        ).rejects.toThrow('Gig not found');

        expect(gigOfferRepository.getOffersForGig).not.toHaveBeenCalled();
    });

    it('returns empty offers list', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Web Design',
            }),
        };
        const gigOfferRepository = {
            getOffersForGig: jest.fn().mockResolvedValue([]),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetGigOffersForGig(gigRepository as never, gigOfferRepository as never, userRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
