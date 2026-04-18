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

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { ConflictError } from '@/core';
import { dispatch } from '@/app';
import { ApplyToGig } from './index';

describe('ApplyToGig service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects duplicate applications for the same open gig', async () => {
        const gigRepository = {
            createApplication: jest.fn(),
        };

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'employer-1', status: 'open' }])
            .mockResolvedValueOnce([{ id: 'talent-profile-1' }])
            .mockResolvedValueOnce([{ id: 'application-1', status: 'submitted' }]);

        const service = new ApplyToGig(gigRepository as never);

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
        const service = new ApplyToGig({
            createApplication,
        } as never);

        (dispatch as jest.Mock)
            .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'employer-1', status: 'open' }])
            .mockResolvedValueOnce([{ id: 'talent-profile-1' }])
            .mockResolvedValueOnce([null])
            .mockResolvedValueOnce([undefined]);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                proposalMessage: 'I am a great fit for this event.',
                proposedRate: 75000,
                proposedCurrency: 'NGN',
            },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(createApplication).toHaveBeenCalledWith('gig-1', 'talent-1', {
            proposalMessage: 'I am a great fit for this event.',
            proposedRate: 75000,
            proposedCurrency: 'NGN',
        });
        expect(dispatch).toHaveBeenCalledWith('user:create-activity', {
            userId: 'talent-1',
            type: 'gig_applied',
            targetId: 'gig-1',
            targetType: 'gig',
        });
        expect(response.code).toBe(201);
    });
});
