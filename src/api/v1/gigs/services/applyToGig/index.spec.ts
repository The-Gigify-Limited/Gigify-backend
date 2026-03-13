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
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

jest.mock('~/talents/repository', () => ({
    TalentRepository: class TalentRepository {},
}));

jest.mock('~/user/repository', () => ({
    ActivityRepository: class ActivityRepository {},
}));

import { ConflictError } from '@/core';
import { ApplyToGig } from './index';

describe('ApplyToGig service', () => {
    it('rejects duplicate applications for the same open gig', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                status: 'open',
            }),
            findApplicationByGigAndTalent: jest.fn().mockResolvedValue({
                id: 'application-1',
                status: 'submitted',
            }),
        };
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-profile-1',
            }),
        };
        const activityRepository = {
            logActivity: jest.fn(),
        };

        const service = new ApplyToGig(gigRepository as never, talentRepository as never, activityRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                input: {},
                request: { user: { id: 'talent-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it('creates a new application and logs a gig_applied activity', async () => {
        const createApplication = jest.fn().mockResolvedValue({
            id: 'application-1',
            gigId: 'gig-1',
            talentId: 'talent-1',
            status: 'submitted',
        });
        const activityRepository = {
            logActivity: jest.fn().mockResolvedValue(undefined),
        };
        const service = new ApplyToGig(
            {
                getGigById: jest.fn().mockResolvedValue({
                    id: 'gig-1',
                    employerId: 'employer-1',
                    status: 'open',
                }),
                findApplicationByGigAndTalent: jest.fn().mockResolvedValue(null),
                createApplication,
            } as never,
            {
                findByUserId: jest.fn().mockResolvedValue({
                    id: 'talent-profile-1',
                }),
            } as never,
            activityRepository as never,
        );

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                coverMessage: 'I am a great fit for this event.',
                proposedRate: 75000,
            },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(createApplication).toHaveBeenCalledWith('gig-1', 'talent-1', {
            coverMessage: 'I am a great fit for this event.',
            proposedRate: 75000,
        });
        expect(activityRepository.logActivity).toHaveBeenCalledWith('talent-1', 'gig_applied', 'gig-1', {
            applicationId: 'application-1',
        });
        expect(response.code).toBe(201);
    });
});
