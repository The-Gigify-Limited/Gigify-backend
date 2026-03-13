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

jest.mock('../../repository', () => ({
    GigOfferRepository: class GigOfferRepository {},
    GigRepository: class GigRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { CreateGigOffer } from './index';

describe('CreateGigOffer service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates an offer and notifies the recipient talent', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Afrobeat Night Drummer',
                currency: 'NGN',
                requiredTalentCount: 1,
                status: 'open',
            }),
            findApplicationByGigAndTalent: jest.fn().mockResolvedValue(null),
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
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'talent-1',
                role: 'talent',
            }),
            mapToCamelCase: jest.fn((value) => value),
        };

        const service = new CreateGigOffer(gigRepository as never, gigOfferRepository as never, userRepository as never);

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
        expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
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
