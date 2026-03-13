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

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
    GigOfferRepository: class GigOfferRepository {},
}));

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

jest.mock('~/user/repository', () => ({
    ActivityRepository: class ActivityRepository {},
}));

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

import { HireTalent } from './index';

describe('HireTalent service', () => {
    it('marks the application as hired, moves the gig in progress, and creates a pending payment', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                budgetAmount: 100000,
                currency: 'NGN',
                status: 'open',
            }),
            findApplicationByGigAndTalent: jest.fn().mockResolvedValue({
                id: 'application-1',
                talentId: 'talent-1',
                status: 'submitted',
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
        const earningsRepository = {
            createPayment: jest.fn().mockResolvedValue({
                id: 'payment-1',
                status: 'pending',
            }),
        };
        const gigOfferRepository = {
            expirePendingOffersForGig: jest.fn().mockResolvedValue([]),
        };
        const activityRepository = {
            logActivity: jest.fn().mockResolvedValue(undefined),
        };

        const service = new HireTalent(gigRepository as never, gigOfferRepository as never, earningsRepository as never, activityRepository as never);

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
        expect(earningsRepository.createPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                employerId: 'employer-1',
                talentId: 'talent-1',
                amount: 100000,
                status: 'pending',
            }),
        );
        expect(activityRepository.logActivity).toHaveBeenCalledTimes(2);
        expect(response.message).toBe('Talent Hired Successfully');
    });
});
