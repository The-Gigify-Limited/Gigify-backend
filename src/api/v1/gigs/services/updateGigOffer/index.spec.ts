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
        } as never)) as any;

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
});
