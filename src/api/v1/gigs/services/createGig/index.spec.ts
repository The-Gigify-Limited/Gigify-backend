jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { CREATED: 201 },
        UnAuthorizedError,
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { dispatch } from '@/app';
import { CreateGig } from './index';

describe('CreateGig service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a gig and logs activity', async () => {
        const gigRepository = {
            createGig: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Web Design Project',
                description: 'Need a modern website',
                budgetAmount: 2000,
                status: 'open',
            }),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([undefined]).mockResolvedValueOnce([undefined]);

        const service = new CreateGig(gigRepository as never);

        const response = await service.handle({
            input: {
                title: 'Web Design Project',
                description: 'Need a modern website',
                budgetAmount: 2000,
                currency: 'USD',
            },
            request: {
                user: { id: 'employer-1' },
            },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('employer:create-profile', { user_id: 'employer-1' });
        expect(gigRepository.createGig).toHaveBeenCalledWith(
            'employer-1',
            expect.objectContaining({
                title: 'Web Design Project',
                budgetAmount: 2000,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith('user:create-activity', {
            userId: 'employer-1',
            type: 'gig_posted',
            targetId: 'gig-1',
            targetType: 'gig',
            description: 'Web Design Project',
        });
        expect(response.message).toBe('Gig Created Successfully');
        expect(response.data.id).toBe('gig-1');
    });

    it('throws when user is not authenticated', async () => {
        const gigRepository = {
            createGig: jest.fn(),
        };

        const service = new CreateGig(gigRepository as never);

        await expect(
            service.handle({
                input: {
                    title: 'Web Design Project',
                },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(gigRepository.createGig).not.toHaveBeenCalled();
    });
});
