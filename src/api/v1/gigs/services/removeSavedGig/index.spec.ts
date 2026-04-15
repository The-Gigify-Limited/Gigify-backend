jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    SavedGigRepository: class SavedGigRepository {},
}));

import { RemoveSavedGig } from './index';

describe('RemoveSavedGig service', () => {
    it('removes a saved gig for authenticated user', async () => {
        const savedGigRepository = {
            removeGig: jest.fn().mockResolvedValue(undefined),
        };

        const service = new RemoveSavedGig(savedGigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(savedGigRepository.removeGig).toHaveBeenCalledWith('user-1', 'gig-1');
        expect(response.message).toBe('Gig Removed from Saved List Successfully');
    });

    it('throws when user is not authenticated', async () => {
        const savedGigRepository = {
            removeGig: jest.fn(),
        };

        const service = new RemoveSavedGig(savedGigRepository as never);

        await expect(
            service.handle({
                params: { id: 'gig-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(savedGigRepository.removeGig).not.toHaveBeenCalled();
    });
});
