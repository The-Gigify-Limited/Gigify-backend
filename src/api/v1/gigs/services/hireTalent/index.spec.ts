jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
    GigOfferRepository: class GigOfferRepository {},
}));

import { ConflictError } from '@/core';
import { dispatch } from '@/app';
import { HireTalent } from './index';

function buildGigRepo() {
    return {
        getGigById: jest.fn().mockResolvedValue({
            id: 'gig-1',
            employerId: 'employer-1',
            budgetAmount: 100000,
            currency: 'NGN',
            status: 'open',
            requiredTalentCount: 1,
            title: 'Test Gig',
        }),
        getApplicationsForGig: jest.fn().mockResolvedValue([]),
        updateApplication: jest.fn().mockResolvedValue({
            id: 'application-1',
            talentId: 'talent-1',
            status: 'hired',
        }),
        updateGigById: jest.fn().mockResolvedValue({
            id: 'gig-1',
            status: 'in_progress',
        }),
        rejectOtherApplications: jest.fn().mockResolvedValue(undefined),
    };
}

describe('HireTalent service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('marks the application as hired, moves the gig in progress, and creates a pending payment', async () => {
        const gigRepository = buildGigRepo();
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn().mockResolvedValue([]),
            findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue(null),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'application-1', talentId: 'talent-1', status: 'submitted' }])
            .mockResolvedValueOnce([
                { employerId: 'employer-1', talentId: 'talent-1', gigId: 'gig-1', amount: 100000, id: 'payment-1', status: 'pending' },
            ])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined]);

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1', talentId: 'talent-1' },
            input: {},
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(gigRepository.updateApplication).toHaveBeenCalledWith(
            'application-1',
            expect.objectContaining({
                status: 'hired',
            }),
        );
        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', {
            status: 'in_progress',
        });
        expect(dispatch).toHaveBeenCalledWith(
            'earnings:create-record',
            expect.objectContaining({
                employerId: 'employer-1',
                talentId: 'talent-1',
                amount: 100000,
            }),
        );
        expect(response.message).toBe('Talent Hired Successfully');
    });

    it('allows direct hire when no offer was ever sent to the talent', async () => {
        const gigRepository = buildGigRepo();
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn().mockResolvedValue([]),
            findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue(null),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'application-1', talentId: 'talent-1', status: 'submitted' }])
            .mockResolvedValueOnce([{ id: 'payment-1' }])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined]);

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never);

        await service.handle({
            params: { id: 'gig-1', talentId: 'talent-1' },
            input: {},
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(gigOfferRepository.findLatestOfferForGigAndTalent).toHaveBeenCalledWith('gig-1', 'talent-1');
        expect(gigRepository.updateApplication).toHaveBeenCalled();
    });

    it('blocks direct hire when an outstanding pending offer exists', async () => {
        const gigRepository = buildGigRepo();
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn(),
            findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue({ id: 'offer-1', status: 'pending' }),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'application-1', talentId: 'talent-1', status: 'submitted' }]);

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1', talentId: 'talent-1' },
                input: {},
                request: { user: { id: 'employer-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);

        expect(gigRepository.updateApplication).not.toHaveBeenCalled();
    });

    it('blocks direct hire when the most recent offer was countered', async () => {
        const gigRepository = buildGigRepo();
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn(),
            findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue({ id: 'offer-1', status: 'countered' }),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([{ id: 'application-1', talentId: 'talent-1', status: 'submitted' }]);

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1', talentId: 'talent-1' },
                input: {},
                request: { user: { id: 'employer-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it('allows direct hire when the latest offer is accepted', async () => {
        const gigRepository = buildGigRepo();
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn().mockResolvedValue([]),
            findLatestOfferForGigAndTalent: jest.fn().mockResolvedValue({ id: 'offer-1', status: 'accepted' }),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'application-1', talentId: 'talent-1', status: 'submitted' }])
            .mockResolvedValueOnce([{ id: 'payment-1' }])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined]);

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never);

        await service.handle({
            params: { id: 'gig-1', talentId: 'talent-1' },
            input: {},
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(gigRepository.updateApplication).toHaveBeenCalled();
    });
});
