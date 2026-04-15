jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
    };
});

jest.mock('~/talents/repository', () => ({
    TalentRepository: class TalentRepository {},
}));

import { UpdateTalentById } from './index';

describe('UpdateTalentById service', () => {
    it('updates talent profile', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
                bio: 'Designer',
            }),
            updateById: jest.fn().mockResolvedValue({
                id: 'talent-1',
                user_id: 'user-1',
                bio: 'Updated bio',
                hourly_rate: 50,
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'talent-1',
                userId: 'user-1',
                bio: 'Updated bio',
                hourlyRate: 50,
            }),
        };

        const service = new UpdateTalentById(talentRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            input: { bio: 'Updated bio', hourlyRate: 50 },
        } as never);

        expect(talentRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(talentRepository.updateById).toHaveBeenCalledWith(
            'talent-1',
            expect.objectContaining({
                biography: 'Updated bio',
            }),
        );
        expect(talentRepository.mapToCamelCase).toHaveBeenCalled();
        expect(response.message).toBe('Talent Updated Successfully');
        expect(response.data.biography).toBe('Updated bio');
    });

    it('throws when talent id is not provided', async () => {
        const talentRepository = {
            findByUserId: jest.fn(),
            updateById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new UpdateTalentById(talentRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
                input: { bio: 'Updated' },
            } as never),
        ).rejects.toThrow('No Talent ID Found!');

        expect(talentRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when talent profile not found', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
            updateById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new UpdateTalentById(talentRepository as never);

        await expect(
            service.handle({
                params: { id: 'user-1' },
                input: { bio: 'Updated' },
            } as never),
        ).rejects.toThrow('Talent profile not found');

        expect(talentRepository.updateById).not.toHaveBeenCalled();
    });
});
