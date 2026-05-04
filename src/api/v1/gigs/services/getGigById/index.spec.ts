const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

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
    SavedGigRepository: class SavedGigRepository {},
    GigOfferRepository: class GigOfferRepository {},
}));

import { GetGigById } from './index';

const baseGig = {
    id: 'gig-1',
    employerId: 'employer-1',
    title: 'Lagos rooftop set',
    description: 'DJ set',
    serviceId: null,
    isRemote: false,
    gigDate: '2026-12-01',
    budgetAmount: 200000,
    currency: 'NGN',
    status: 'open' as const,
    createdAt: null,
    updatedAt: null,
    requiredTalentCount: 1,
    locationLatitude: null,
    locationLongitude: null,
    venueName: 'Sky Lounge',
    displayImage: 'https://cdn.example.com/g.jpg',
    gigTypeId: '11111111-1111-1111-1111-111111111111',
    gigType: 'Party',
    gigStartTime: '18:00',
    gigEndTime: '22:00',
    gigLocation: 'Lagos',
    gigAddress: '12 Sky Lane',
    gigPostCode: '101231',
    isEquipmentRequired: false,
    skillRequired: 'DJ',
    durationMinutes: 240,
    dressCode: null,
    additionalNotes: null,
};

const buildRepos = (overrides: Record<string, jest.Mock> = {}) => {
    const gigRepository = {
        getGigById: jest.fn().mockResolvedValue(baseGig),
        getServiceById: jest.fn().mockResolvedValue(null),
        getApplicationsForGig: jest.fn().mockResolvedValue([]),
        ...overrides,
    };
    const savedGigRepository = { findByUserAndGig: jest.fn().mockResolvedValue(null) };
    const gigOfferRepository = { findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue(null) };
    return { gigRepository, savedGigRepository, gigOfferRepository };
};

describe('GetGigById service', () => {
    beforeEach(() => {
        mockDispatch.mockReset();
    });

    it('throws BadRequestError when params.id is missing', async () => {
        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos();
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        await expect(service.handle({ params: undefined, request: { user: undefined } } as never)).rejects.toThrow('Gig ID is required');
        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws RouteNotFoundError when the gig does not exist', async () => {
        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos({
            getGigById: jest.fn().mockResolvedValue(null),
        });
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        await expect(service.handle({ params: { id: 'gig-1' }, request: { user: undefined } } as never)).rejects.toThrow('Gig not found');
    });

    it('returns the raw DB status on the gig response (regression for PR #33)', async () => {
        // Critical assertion: the service must NOT remap `open` → `active`,
        // `in_progress` → `booked`, etc. Earlier behaviour drifted away from
        // the rest of the gig endpoints and this spec locks the fix in.
        mockDispatch.mockResolvedValue([null]);
        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos();
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        const response = await service.handle({ params: { id: 'gig-1' }, request: { user: undefined } } as never);

        expect(response.data.status).toBe('open');
        expect(response.data.status).not.toBe('active');
        expect(response.data.status).not.toBe('booked');
        expect(response.data.status).not.toBe('unpublished');
    });

    it('passes through every FE-aligned gig field unchanged (regression for PR #36)', async () => {
        mockDispatch.mockResolvedValue([null]);
        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos();
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        const response = await service.handle({ params: { id: 'gig-1' }, request: { user: undefined } } as never);

        for (const field of [
            'displayImage',
            'gigTypeId',
            'gigType',
            'gigStartTime',
            'gigEndTime',
            'gigLocation',
            'gigAddress',
            'gigPostCode',
            'isEquipmentRequired',
            'skillRequired',
        ] as const) {
            expect(response.data).toHaveProperty(field, (baseGig as Record<string, unknown>)[field]);
        }
    });

    it('hydrates employer and profile and computes remainingTalentSlots', async () => {
        mockDispatch
            .mockResolvedValueOnce([{ id: 'employer-1', email: 'e@x.com' }]) // user:get-by-id (employer)
            .mockResolvedValueOnce([{ userId: 'employer-1', organizationName: 'Acme' }]); // employer:get-profile

        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos({
            getApplicationsForGig: jest
                .fn()
                .mockResolvedValueOnce([]) // hired only
                .mockResolvedValueOnce([]), // all
        });
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        const response = await service.handle({ params: { id: 'gig-1' }, request: { user: undefined } } as never);

        expect(response.data.employer).toEqual({ id: 'employer-1', email: 'e@x.com' });
        expect(response.data.employerProfile).toEqual({ userId: 'employer-1', organizationName: 'Acme' });
        expect(response.data.remainingTalentSlots).toBe(1);
        expect(response.data.isSaved).toBe(false);
    });

    it('marks isSaved=true when the requesting user has saved the gig', async () => {
        mockDispatch
            .mockResolvedValueOnce([null]) // employer
            .mockResolvedValueOnce([null]) // employer profile
            .mockResolvedValueOnce([null]); // gig:find-application
        const { gigRepository, savedGigRepository, gigOfferRepository } = buildRepos({
            getApplicationsForGig: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
        });
        savedGigRepository.findByUserAndGig = jest.fn().mockResolvedValue({ id: 'saved-1' });
        const service = new GetGigById(gigRepository as never, savedGigRepository as never, gigOfferRepository as never);

        const response = await service.handle({ params: { id: 'gig-1' }, request: { user: { id: 'talent-1' } } } as never);

        expect(savedGigRepository.findByUserAndGig).toHaveBeenCalledWith('talent-1', 'gig-1');
        expect(response.data.isSaved).toBe(true);
    });
});
