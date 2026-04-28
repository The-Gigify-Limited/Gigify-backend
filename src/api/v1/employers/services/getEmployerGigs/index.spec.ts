const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetEmployerGigs } from './index';

describe('GetEmployerGigs service', () => {
    beforeEach(() => {
        mockDispatch.mockReset();
    });

    it('returns gigs filtered by employer id', async () => {
        mockDispatch.mockResolvedValue([{ id: 'user-1' }]);

        const gigRepository = {
            getAllGigs: jest.fn().mockResolvedValue([{ id: 'gig-1', title: 'DJ Set', employerId: 'user-1' }]),
        };

        const service = new GetEmployerGigs(gigRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: { page: 1 },
        } as never);

        expect(mockDispatch).toHaveBeenCalledWith('user:get-by-id', { id: 'user-1' });
        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ page: 1, employerId: 'user-1' });
        expect(response.code).toBe(200);
        expect(response.message).toBe('Employer Gigs Retrieved Successfully');
        expect(response.data).toEqual([{ id: 'gig-1', title: 'DJ Set', employerId: 'user-1' }]);
    });

    it('throws BadRequestError when params.id is missing', async () => {
        const gigRepository = { getAllGigs: jest.fn() };

        const service = new GetEmployerGigs(gigRepository as never);

        await expect(service.handle({ params: {} } as never)).rejects.toThrow('Employer ID is required');
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(gigRepository.getAllGigs).not.toHaveBeenCalled();
    });

    it('throws RouteNotFoundError when the employer user does not exist', async () => {
        mockDispatch.mockResolvedValue([null]);

        const gigRepository = { getAllGigs: jest.fn() };

        const service = new GetEmployerGigs(gigRepository as never);

        await expect(service.handle({ params: { id: 'user-1' }, query: {} } as never)).rejects.toThrow('Employer not found');

        expect(gigRepository.getAllGigs).not.toHaveBeenCalled();
    });

    it('forwards filter query through to the repository and pins employerId', async () => {
        mockDispatch.mockResolvedValue([{ id: 'user-1' }]);

        const gigRepository = { getAllGigs: jest.fn().mockResolvedValue([]) };

        const service = new GetEmployerGigs(gigRepository as never);

        await service.handle({
            params: { id: 'user-1' },
            query: { status: 'open', page: 2, pageSize: 10, search: 'DJ' },
        } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({
            status: 'open',
            page: 2,
            pageSize: 10,
            search: 'DJ',
            employerId: 'user-1',
        });
    });

    it('handles missing query gracefully', async () => {
        mockDispatch.mockResolvedValue([{ id: 'user-1' }]);

        const gigRepository = { getAllGigs: jest.fn().mockResolvedValue([]) };

        const service = new GetEmployerGigs(gigRepository as never);

        await service.handle({ params: { id: 'user-1' } } as never);

        expect(gigRepository.getAllGigs).toHaveBeenCalledWith({ employerId: 'user-1' });
    });
});
