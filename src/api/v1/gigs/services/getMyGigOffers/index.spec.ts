jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigOfferRepository: class GigOfferRepository {},
    GigRepository: class GigRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { GetMyGigOffers } from './index';

describe('GetMyGigOffers service', () => {
    it('retrieves received offers for talents by default', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest
                .fn()
                .mockResolvedValue([{ id: 'offer-1', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-1', status: 'pending' }]),
        };
        const gigRepository = {
            getGigsByIds: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Project A' }]),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValueOnce({ id: 'emp-1', name: 'Employer' }).mockResolvedValueOnce({ id: 'tal-1', name: 'Talent' }),
            mapToCamelCase: jest.fn().mockImplementation((user) => user),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'tal-1', role: 'talent' },
            },
        } as never);

        expect(gigOfferRepository.getOffersForUser).toHaveBeenCalledWith(
            'tal-1',
            expect.objectContaining({
                direction: 'received',
            }),
        );
        expect(response.message).toBe('Gig Offers Retrieved Successfully');
        expect(response.data).toHaveLength(1);
    });

    it('retrieves sent offers for employers by default', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest.fn().mockResolvedValue([]),
        };
        const gigRepository = {
            getGigsByIds: jest.fn().mockResolvedValue([]),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        await service.handle({
            query: {},
            request: {
                user: { id: 'emp-1', role: 'employer' },
            },
        } as never);

        expect(gigOfferRepository.getOffersForUser).toHaveBeenCalledWith(
            'emp-1',
            expect.objectContaining({
                direction: 'sent',
            }),
        );
    });

    it('overrides direction when provided in query', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest.fn().mockResolvedValue([]),
        };
        const gigRepository = {
            getGigsByIds: jest.fn().mockResolvedValue([]),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        await service.handle({
            query: { direction: 'sent' },
            request: {
                user: { id: 'tal-1', role: 'talent' },
            },
        } as never);

        expect(gigOfferRepository.getOffersForUser).toHaveBeenCalledWith(
            'tal-1',
            expect.objectContaining({
                direction: 'sent',
            }),
        );
    });

    it('maps gigs and users in response', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest.fn().mockResolvedValue([
                { id: 'offer-1', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-1' },
                { id: 'offer-2', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-2' },
            ]),
        };
        const gigRepository = {
            getGigsByIds: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Project A' }]),
        };
        const userRepository = {
            findById: jest
                .fn()
                .mockResolvedValueOnce({ id: 'emp-1', name: 'Employer' })
                .mockResolvedValueOnce({ id: 'tal-1', name: 'Talent 1' })
                .mockResolvedValueOnce({ id: 'tal-2', name: 'Talent 2' }),
            mapToCamelCase: jest.fn().mockImplementation((user) => user),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'emp-1', role: 'employer' },
            },
        } as never);

        expect(response.data[0].gig).not.toBeNull();
        expect(response.data[0].employer).not.toBeNull();
        expect(response.data[0].talent).not.toBeNull();
    });

    it('returns null for missing users', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest.fn().mockResolvedValue([{ id: 'offer-1', gigId: 'gig-1', employerId: 'emp-1', talentId: 'tal-1' }]),
        };
        const gigRepository = {
            getGigsByIds: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'Project A' }]),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'emp-1', role: 'employer' },
            },
        } as never);

        expect(response.data[0].employer).toBeNull();
        expect(response.data[0].talent).toBeNull();
    });

    it('throws when user is not authenticated', async () => {
        const gigOfferRepository = {
            getOffersForUser: jest.fn(),
        };
        const gigRepository = {
            getGigsByIds: jest.fn(),
        };
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetMyGigOffers(gigOfferRepository as never, gigRepository as never, userRepository as never);

        await expect(
            service.handle({
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(gigOfferRepository.getOffersForUser).not.toHaveBeenCalled();
    });
});
