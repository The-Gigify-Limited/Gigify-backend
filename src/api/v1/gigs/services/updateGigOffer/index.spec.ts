const mockAuditLog = jest.fn();

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
        auditService: {
            log: mockAuditLog,
        },
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('../../repository', () => ({
    GigOfferRepository: class GigOfferRepository {},
    GigRepository: class GigRepository {},
}));

import { dispatch } from '@/app';
import { UpdateGigOffer } from './index';

describe('UpdateGigOffer service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('accepts an offer, creates a hired application, and opens a pending payment', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Manchester Rooftop Strings Trio',
                budgetAmount: 1900,
                currency: 'GBP',
                requiredTalentCount: 1,
                status: 'open',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
            createApplication: jest.fn().mockResolvedValue({
                id: 'application-1',
                status: 'hired',
            }),
            updateApplication: jest.fn().mockResolvedValue({
                id: 'application-1',
                status: 'hired',
            }),
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'in_progress',
            }),
            rejectOtherApplications: jest.fn().mockResolvedValue(undefined),
        };
        const gigOfferRepository = {
            getOfferById: jest.fn().mockResolvedValue({
                id: 'offer-1',
                gigId: 'gig-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                status: 'pending',
                proposedRate: 1900,
                currency: 'GBP',
                expiresAt: null,
                message: 'You are our first choice.',
            }),
            updateOffer: jest.fn().mockResolvedValue({
                id: 'offer-1',
                status: 'accepted',
            }),
            expirePendingOffersForGig: jest.fn().mockResolvedValue([]),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([null])
            .mockResolvedValueOnce([{ id: 'payment-1', status: 'pending' }])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined]);

        const service = new UpdateGigOffer(gigRepository as never, gigOfferRepository as never);

        const response = (await service.handle({
            params: { offerId: 'offer-1' },
            input: { status: 'accepted' },
            request: {
                user: { id: 'talent-1' },
                ip: '127.0.0.1',
                headers: { 'user-agent': 'jest' },
            },
        } as never)) as { data: { remainingTalentSlots: number } };

        expect(gigRepository.createApplication).toHaveBeenCalledWith(
            'gig-1',
            'talent-1',
            expect.objectContaining({
                proposedRate: 1900,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            'earnings:create-record',
            expect.objectContaining({
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
            }),
        );
        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', {
            status: 'in_progress',
        });
        expect(mockAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'gig_offer_accepted',
                resourceId: 'offer-1',
            }),
        );
        expect(response.data.remainingTalentSlots).toBe(0);
    });

    it('counters a pending offer with counterAmount and dispatches gig:offer-countered', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Lagos Rooftop Set',
                status: 'open',
            }),
        };
        const gigOfferRepository = {
            getOfferById: jest.fn().mockResolvedValue({
                id: 'offer-1',
                gigId: 'gig-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                status: 'pending',
                proposedRate: 120000,
                currency: 'NGN',
                expiresAt: null,
            }),
            updateOffer: jest.fn().mockResolvedValue({
                id: 'offer-1',
                status: 'countered',
                counterAmount: 150000,
                counterMessage: 'Can we do 150k instead?',
            }),
        };

        (dispatch as jest.Mock).mockResolvedValue([undefined]);

        const service = new UpdateGigOffer(gigRepository as never, gigOfferRepository as never);

        const response = await service.handle({
            params: { offerId: 'offer-1' },
            input: {
                status: 'countered',
                counterAmount: 150000,
                counterMessage: 'Can we do 150k instead?',
            },
            request: {
                user: { id: 'talent-1' },
                ip: '127.0.0.1',
                headers: { 'user-agent': 'jest' },
            },
        } as never);

        expect(gigOfferRepository.updateOffer).toHaveBeenCalledWith(
            'offer-1',
            expect.objectContaining({
                status: 'countered',
                counterAmount: 150000,
                counterMessage: 'Can we do 150k instead?',
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            'gig:offer-countered',
            expect.objectContaining({
                gigId: 'gig-1',
                offerId: 'offer-1',
                counterAmount: 150000,
            }),
        );
        expect(response.message).toBe('Gig Offer Countered Successfully');
    });

    it('rejects counter without a counterAmount at schema level (BadRequestError at service if bypassed)', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({ id: 'gig-1', employerId: 'employer-1', status: 'open', title: 'x' }),
        };
        const gigOfferRepository = {
            getOfferById: jest.fn().mockResolvedValue({
                id: 'offer-1',
                gigId: 'gig-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                status: 'pending',
                expiresAt: null,
            }),
        };

        const service = new UpdateGigOffer(gigRepository as never, gigOfferRepository as never);

        await expect(
            service.handle({
                params: { offerId: 'offer-1' },
                input: { status: 'countered' } as never,
                request: { user: { id: 'talent-1' }, ip: '1', headers: {} },
            } as never),
        ).rejects.toThrow('counterAmount is required when countering an offer');
    });

    it('refuses counter from the employer side', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
        };
        const gigOfferRepository = {
            getOfferById: jest.fn().mockResolvedValue({
                id: 'offer-1',
                gigId: 'gig-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                status: 'pending',
                expiresAt: null,
            }),
        };

        const service = new UpdateGigOffer(gigRepository as never, gigOfferRepository as never);

        await expect(
            service.handle({
                params: { offerId: 'offer-1' },
                input: { status: 'countered', counterAmount: 150000 },
                request: { user: { id: 'employer-1' }, ip: '1', headers: {} },
            } as never),
        ).rejects.toThrow('Only the recipient can respond');
    });
});
