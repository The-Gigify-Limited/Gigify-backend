jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
    GigOfferRepository: class GigOfferRepository {},
}));

import { dispatch } from '@/app';
import { UpdateGigStatus } from './index';

describe('UpdateGigStatus service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updates gig status and logs activities for hired talents', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Project A',
                status: 'open',
            }),
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Project A',
                status: 'in_progress',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([
                { id: 'app-1', talentId: 'talent-1', status: 'hired' },
                { id: 'app-2', talentId: 'talent-2', status: 'hired' },
            ]),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([undefined]).mockResolvedValueOnce([undefined]);

        const service = new UpdateGigStatus(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: { status: 'in_progress' },
        } as never);

        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', { status: 'in_progress' });
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith(
            'user:create-activity',
            expect.objectContaining({
                userId: 'talent-1',
                type: 'gig_started',
                targetId: 'gig-1',
            }),
        );
        expect(response.message).toBe('Gig Status Updated Successfully');
    });

    it('logs completion activities when gig is completed', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'in_progress',
            }),
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'completed',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([{ id: 'app-1', talentId: 'talent-1', status: 'hired' }]),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([undefined]);

        const service = new UpdateGigStatus(gigRepository as never);

        await service.handle({
            params: { id: 'gig-1' },
            input: { status: 'completed' },
        } as never);

        expect(dispatch).toHaveBeenCalledWith(
            'user:create-activity',
            expect.objectContaining({
                userId: 'talent-1',
                type: 'gig_completed',
            }),
        );
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            getGigById: jest.fn(),
            updateGigById: jest.fn(),
            getApplicationsForGig: jest.fn(),
        };

        const service = new UpdateGigStatus(gigRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                input: { status: 'in_progress' },
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.getGigById).not.toHaveBeenCalled();
    });

    it('throws when gig not found', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue(null),
            updateGigById: jest.fn(),
            getApplicationsForGig: jest.fn(),
        };

        const service = new UpdateGigStatus(gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                input: { status: 'in_progress' },
            } as never),
        ).rejects.toThrow('Gig not found');
    });

    it('throws when status transition is invalid', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'completed',
            }),
            updateGigById: jest.fn(),
            getApplicationsForGig: jest.fn(),
        };

        const service = new UpdateGigStatus(gigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                input: { status: 'open' },
            } as never),
        ).rejects.toThrow('Gig cannot move from completed to open');

        expect(gigRepository.updateGigById).not.toHaveBeenCalled();
    });

    it('allows draft to open transition', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'draft',
            }),
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                status: 'open',
            }),
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
        };

        const service = new UpdateGigStatus(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: { status: 'open' },
        } as never);

        expect(response.data.status).toBe('open');
    });

    it('allows open to expired transition and leaves expired as a terminal state', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValueOnce({ id: 'gig-1', status: 'open' }).mockResolvedValueOnce({ id: 'gig-1', status: 'expired' }),
            updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'expired' }),
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
        };
        const gigOfferRepository = { countOffersForGig: jest.fn() };

        const service = new UpdateGigStatus(gigRepository as never, gigOfferRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: { status: 'expired' },
        } as never);

        expect(response.data.status).toBe('expired');

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                input: { status: 'open' },
            } as never),
        ).rejects.toThrow('Gig cannot move from expired to open');
    });

    it('reverts an open gig back to draft only when no offers have been sent', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'open' }),
            updateGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'draft' }),
            getApplicationsForGig: jest.fn().mockResolvedValue([]),
        };
        const gigOfferRepository = { countOffersForGig: jest.fn().mockResolvedValue(0) };

        const service = new UpdateGigStatus(gigRepository as never, gigOfferRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: { status: 'draft' },
        } as never);

        expect(gigOfferRepository.countOffersForGig).toHaveBeenCalledWith('gig-1');
        expect(response.data.status).toBe('draft');
    });

    it('rejects reverting an open gig to draft when offers have already been sent', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({ id: 'gig-1', status: 'open' }),
            updateGigById: jest.fn(),
            getApplicationsForGig: jest.fn(),
        };
        const gigOfferRepository = { countOffersForGig: jest.fn().mockResolvedValue(2) };

        const service = new UpdateGigStatus(gigRepository as never, gigOfferRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                input: { status: 'draft' },
            } as never),
        ).rejects.toThrow('Cannot revert to draft: offers have already been sent for this gig.');

        expect(gigRepository.updateGigById).not.toHaveBeenCalled();
    });
});
