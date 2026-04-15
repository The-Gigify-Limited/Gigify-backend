const mockAuditLog = jest.fn();

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { CREATED: 201 },
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
import { CreateGigOffer } from './index';

describe('CreateGigOffer service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates an offer and notifies the recipient talent', async () => {
        const gigRepository = {
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
        };
        const gigOfferRepository = {
            findPendingOffer: jest.fn().mockResolvedValue(null),
            createOffer: jest.fn().mockResolvedValue({
                id: 'offer-1',
                gigId: 'gig-1',
                talentId: 'talent-1',
                employerId: 'employer-1',
                status: 'pending',
                proposedRate: 180000,
                currency: 'NGN',
            }),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([
                { id: 'gig-1', employerId: 'employer-1', title: 'Afrobeat Night Drummer', currency: 'NGN', requiredTalentCount: 1, status: 'open' },
            ])
            .mockResolvedValueOnce([{ id: 'talent-1', role: 'talent' }])
            .mockResolvedValueOnce([null])
            .mockResolvedValueOnce([undefined])
            .mockResolvedValueOnce([undefined]);

        const service = new CreateGigOffer(gigRepository as never, gigOfferRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                talentId: 'talent-1',
                proposedRate: 180000,
                message: 'We would love to have you on this booking.',
            },
            request: {
                user: { id: 'employer-1' },
                ip: '127.0.0.1',
                headers: { 'user-agent': 'jest' },
            },
        } as never);

        expect(gigOfferRepository.createOffer).toHaveBeenCalledWith(
            expect.objectContaining({
                gigId: 'gig-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                proposedRate: 180000,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            'notification:dispatch',
            expect.objectContaining({
                userId: 'talent-1',
                type: 'application_update',
            }),
        );
        expect(mockAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'gig_offer_created',
                resourceId: 'offer-1',
            }),
        );
        expect(response.message).toBe('Gig Offer Created Successfully');
    });
});
