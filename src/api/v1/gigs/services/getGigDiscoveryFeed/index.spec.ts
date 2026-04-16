jest.mock('@/core', () => {
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

jest.mock('~/gigs/repository', () => ({
    GigOfferRepository: class GigOfferRepository {},
    GigRepository: class GigRepository {},
    SavedGigRepository: class SavedGigRepository {},
}));

jest.mock('~/talents/repository', () => ({
    TalentRepository: class TalentRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { GetGigDiscoveryFeed } from './index';

describe('GetGigDiscoveryFeed service', () => {
    it('returns populated discovery sections for the talent home screen', async () => {
        const userRepository = {
            findById: jest.fn().mockImplementation(async (id: string) => {
                if (id === 'talent-1') {
                    return {
                        id,
                        locationLatitude: 6.5244,
                        locationLongitude: 3.3792,
                        locationCity: 'Lagos',
                        locationCountry: 'Nigeria',
                    };
                }

                return {
                    id,
                    role: 'employer',
                    firstName: 'Employer',
                };
            }),
            mapToCamelCase: jest.fn((value) => value),
        };
        const gigRepository = {
            getCatalog: jest.fn().mockResolvedValue([
                {
                    id: 'service-dj',
                    name: 'DJ',
                    category: 'Music',
                },
            ]),
            getAllGigs: jest.fn().mockResolvedValue([
                {
                    id: 'gig-near',
                    employerId: 'employer-1',
                    title: 'Lagos Rooftop DJ',
                    description: 'Afrobeat DJ needed',
                    budgetAmount: 200000,
                    gigDate: new Date(Date.now() + 86400000).toISOString(),
                    serviceId: 'service-dj',
                    venueName: 'Lekki, Lagos',
                    locationLatitude: 6.4551,
                    locationLongitude: 3.4536,
                    isRemote: false,
                    requiredTalentCount: 1,
                    status: 'open',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 'gig-remote',
                    employerId: 'employer-2',
                    title: 'Remote DJ Stream',
                    description: 'Remote livestream DJ set',
                    budgetAmount: 150000,
                    gigDate: new Date(Date.now() + 172800000).toISOString(),
                    serviceId: 'service-dj',
                    venueName: 'Remote',
                    locationLatitude: null,
                    locationLongitude: null,
                    isRemote: true,
                    requiredTalentCount: 1,
                    status: 'open',
                    createdAt: new Date().toISOString(),
                },
            ]),
            getTalentGigItems: jest.fn().mockResolvedValue([
                {
                    application: { id: 'application-1', status: 'hired' },
                    gig: {
                        id: 'gig-upcoming',
                        employerId: 'employer-3',
                        title: 'Upcoming DJ Set',
                        description: 'Private lounge booking',
                        budgetAmount: 175000,
                        gigDate: new Date(Date.now() + 259200000).toISOString(),
                        serviceId: 'service-dj',
                        venueName: 'Victoria Island, Lagos',
                        locationLatitude: 6.4281,
                        locationLongitude: 3.4219,
                        isRemote: false,
                        requiredTalentCount: 1,
                        status: 'open',
                        createdAt: new Date().toISOString(),
                    },
                },
            ]),
            getGigsByIds: jest.fn().mockResolvedValue([
                {
                    id: 'gig-offer',
                    employerId: 'employer-2',
                    title: 'Direct Offer DJ Set',
                    budgetAmount: 180000,
                    gigDate: new Date(Date.now() + 345600000).toISOString(),
                    serviceId: 'service-dj',
                    venueName: 'Lekki Phase 1, Lagos',
                    locationLatitude: 6.4474,
                    locationLongitude: 3.472,
                    isRemote: false,
                    requiredTalentCount: 1,
                    status: 'open',
                    createdAt: new Date().toISOString(),
                },
            ]),
        };
        const gigOfferRepository = {
            getOffersForUser: jest.fn().mockResolvedValue([
                {
                    id: 'offer-1',
                    gigId: 'gig-offer',
                    employerId: 'employer-2',
                    talentId: 'talent-1',
                    status: 'pending',
                },
            ]),
        };
        const savedGigRepository = {
            getSavedGigsForUser: jest.fn().mockResolvedValue([
                {
                    gigId: 'gig-near',
                },
            ]),
        };
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                primaryRole: 'DJ',
                stageName: 'DJ Maxell',
                skills: ['afrobeat', 'wedding'],
            }),
        };
        const employerRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                organizationName: 'Pulse Live',
            }),
        };

        const service = new GetGigDiscoveryFeed(
            gigRepository as never,
            gigOfferRepository as never,
            savedGigRepository as never,
            talentRepository as never,
            employerRepository as never,
            userRepository as never,
        );

        const response = await service.handle({
            query: { limit: 3 },
            request: {
                user: { id: 'talent-1' },
            },
        } as never);

        expect(response.message).toBe('Gig Discovery Feed Retrieved Successfully');
        expect(response.data.nearYou).toHaveLength(1);
        expect(response.data.recommended).toHaveLength(1);
        expect(response.data.upcoming).toHaveLength(1);
        expect(response.data.offers).toHaveLength(1);
        expect(response.data.nearYou[0].isSaved).toBe(true);
    });
});
