jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { UpdateGig } from './index';

describe('UpdateGig service', () => {
    it('updates a gig', async () => {
        const gigRepository = {
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                title: 'Updated Project',
                description: 'Updated description',
            }),
        };

        const service = new UpdateGig(gigRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                title: 'Updated Project',
                description: 'Updated description',
            },
        } as never);

        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', {
            title: 'Updated Project',
            description: 'Updated description',
        });
        expect(response.message).toBe('Gig Updated Successfully');
        expect(response.data.title).toBe('Updated Project');
    });

    it('forwards the FE-aligned event fields through on update', async () => {
        const gigRepository = {
            updateGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                gigTypeId: '22222222-2222-2222-2222-222222222222',
                gigStartTime: '17:30',
                gigEndTime: '20:30',
                durationMinutes: 180,
                isEquipmentRequired: true,
                dressCode: 'formal',
                additionalNotes: 'Live band, no DJ booth.',
                gigAddress: '5 Marina Road',
                gigLocation: 'Lagos',
                gigPostCode: '100001',
                skillRequired: 'Live Band',
            }),
        };

        const service = new UpdateGig(gigRepository as never);

        await service.handle({
            params: { id: 'gig-1' },
            input: {
                gigTypeId: '22222222-2222-2222-2222-222222222222',
                gigStartTime: '17:30',
                gigEndTime: '20:30',
                durationMinutes: 180,
                isEquipmentRequired: true,
                dressCode: 'formal',
                additionalNotes: 'Live band, no DJ booth.',
                gigAddress: '5 Marina Road',
                gigLocation: 'Lagos',
                gigPostCode: '100001',
                skillRequired: 'Live Band',
            },
        } as never);

        expect(gigRepository.updateGigById).toHaveBeenCalledWith('gig-1', {
            gigTypeId: '22222222-2222-2222-2222-222222222222',
            gigStartTime: '17:30',
            gigEndTime: '20:30',
            durationMinutes: 180,
            isEquipmentRequired: true,
            dressCode: 'formal',
            additionalNotes: 'Live band, no DJ booth.',
            gigAddress: '5 Marina Road',
            gigLocation: 'Lagos',
            gigPostCode: '100001',
            skillRequired: 'Live Band',
        });
    });

    it('throws when gig id is not provided', async () => {
        const gigRepository = {
            updateGigById: jest.fn(),
        };

        const service = new UpdateGig(gigRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                input: { title: 'Updated' },
            } as never),
        ).rejects.toThrow('Gig ID is required');

        expect(gigRepository.updateGigById).not.toHaveBeenCalled();
    });
});
