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

    it('forwards the seven event fields to the repository on create', async () => {
        const gigRepository = {
            createGig: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Lagos rooftop set',
                eventType: 'private_party',
                startTime: '18:00',
                endTime: '22:00',
                durationMinutes: 240,
                equipmentProvided: true,
                dressCode: 'smart_casual',
                additionalNotes: 'No smoke machines please.',
            }),
        };

        (dispatch as jest.Mock).mockResolvedValueOnce([undefined]).mockResolvedValueOnce([undefined]);

        const service = new CreateGig(gigRepository as never);

        await service.handle({
            input: {
                title: 'Lagos rooftop set',
                budgetAmount: 200000,
                gigDate: '2026-05-20',
                venueName: 'Sky Lounge',
                eventType: 'private_party',
                startTime: '18:00',
                endTime: '22:00',
                durationMinutes: 240,
                equipmentProvided: true,
                dressCode: 'smart_casual',
                additionalNotes: 'No smoke machines please.',
            },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(gigRepository.createGig).toHaveBeenCalledWith(
            'employer-1',
            expect.objectContaining({
                eventType: 'private_party',
                startTime: '18:00',
                endTime: '22:00',
                durationMinutes: 240,
                equipmentProvided: true,
                dressCode: 'smart_casual',
                additionalNotes: 'No smoke machines please.',
            }),
        );
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
