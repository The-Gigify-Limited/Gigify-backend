const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

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

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { BadRequestError, ConflictError, RouteNotFoundError } from '@/core';
import { UpdateApplicationStatus } from './index';

function makeRepo(overrides: { gig?: Record<string, unknown> | null; application?: Record<string, unknown> | null } = {}) {
    const gig = overrides.gig === undefined ? { id: 'gig-1', employerId: 'employer-1' } : overrides.gig;
    const application =
        overrides.application === undefined ? { id: 'app-1', gigId: 'gig-1', talentId: 'talent-1', status: 'submitted' } : overrides.application;

    return {
        getGigById: jest.fn().mockResolvedValue(gig),
        getApplicationById: jest.fn().mockResolvedValue(application),
        updateApplication: jest.fn().mockImplementation((id: string, updates: Record<string, unknown>) => ({
            ...(application as Record<string, unknown>),
            ...updates,
            id,
        })),
    };
}

function buildArgs(status: 'shortlisted' | 'rejected', extras: Record<string, unknown> = {}) {
    return {
        params: { gigId: 'gig-1', applicationId: 'app-1' },
        input: { status, ...extras },
    } as never;
}

describe('UpdateApplicationStatus service', () => {
    beforeEach(() => {
        mockDispatch.mockReset().mockResolvedValue([]);
    });

    it('shortlists a submitted application and dispatches gig:application-shortlisted', async () => {
        const repo = makeRepo();
        const service = new UpdateApplicationStatus(repo as never);

        const response = await service.handle(buildArgs('shortlisted'));

        expect(repo.updateApplication).toHaveBeenCalledWith('app-1', { status: 'shortlisted' });
        expect(mockDispatch).toHaveBeenCalledWith('gig:application-shortlisted', {
            gigId: 'gig-1',
            applicationId: 'app-1',
            talentId: 'talent-1',
            employerId: 'employer-1',
        });
        expect(response.data.status).toBe('shortlisted');
    });

    it('rejects a submitted application and dispatches gig:application-rejected', async () => {
        const repo = makeRepo();
        const service = new UpdateApplicationStatus(repo as never);

        const response = await service.handle(buildArgs('rejected', { employerNotes: 'Not a match on rate.' }));

        expect(repo.updateApplication).toHaveBeenCalledWith('app-1', {
            status: 'rejected',
            employerNotes: 'Not a match on rate.',
        });
        expect(mockDispatch).toHaveBeenCalledWith('gig:application-rejected', expect.any(Object));
        expect(response.data.status).toBe('rejected');
    });

    it('allows shortlisting from reviewing state', async () => {
        const repo = makeRepo({ application: { id: 'app-1', gigId: 'gig-1', talentId: 'talent-1', status: 'reviewing' } });
        const service = new UpdateApplicationStatus(repo as never);

        const response = await service.handle(buildArgs('shortlisted'));

        expect(response.data.status).toBe('shortlisted');
    });

    it('returns 409 when shortlisting a rejected application', async () => {
        const repo = makeRepo({ application: { id: 'app-1', gigId: 'gig-1', talentId: 'talent-1', status: 'rejected' } });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('shortlisted'))).rejects.toBeInstanceOf(ConflictError);
        expect(repo.updateApplication).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('returns 409 when rejecting a hired application', async () => {
        const repo = makeRepo({ application: { id: 'app-1', gigId: 'gig-1', talentId: 'talent-1', status: 'hired' } });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('rejected'))).rejects.toBeInstanceOf(ConflictError);
    });

    it('returns 409 when the status is already the target value', async () => {
        const repo = makeRepo({ application: { id: 'app-1', gigId: 'gig-1', talentId: 'talent-1', status: 'shortlisted' } });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('shortlisted'))).rejects.toBeInstanceOf(ConflictError);
    });

    it('rejects an application that belongs to a different gig', async () => {
        const repo = makeRepo({ application: { id: 'app-1', gigId: 'other-gig', talentId: 'talent-1', status: 'submitted' } });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('shortlisted'))).rejects.toBeInstanceOf(BadRequestError);
        expect(repo.updateApplication).not.toHaveBeenCalled();
    });

    it('404s when the gig does not exist', async () => {
        const repo = makeRepo({ gig: null });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('shortlisted'))).rejects.toBeInstanceOf(RouteNotFoundError);
    });

    it('404s when the application does not exist', async () => {
        const repo = makeRepo({ application: null });
        const service = new UpdateApplicationStatus(repo as never);

        await expect(service.handle(buildArgs('shortlisted'))).rejects.toBeInstanceOf(RouteNotFoundError);
    });
});
