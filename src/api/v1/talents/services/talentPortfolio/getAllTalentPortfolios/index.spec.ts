jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('~/talents/repository', () => ({
    TalentPortfolioRepository: class TalentPortfolioRepository {},
    TalentRepository: class TalentRepository {},
}));

import { GetTalentPortfolios } from './index';

describe('GetTalentPortfolios service', () => {
    it('retrieves portfolio items for a talent', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
            }),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn().mockResolvedValue([
                { id: 'port-1', talentId: 'talent-1', imageUrl: 'image1.jpg', title: 'Project A' },
                { id: 'port-2', talentId: 'talent-1', imageUrl: 'image2.jpg', title: 'Project B' },
            ]),
        };

        const service = new GetTalentPortfolios(talentPortfolioRepository as never, talentRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
        } as never);

        expect(talentRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(talentPortfolioRepository.findByTalentId).toHaveBeenCalledWith('talent-1');
        expect(response.message).toBe('Talent Portfolio Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('throws when user id is not provided', async () => {
        const talentRepository = {
            findByUserId: jest.fn(),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn(),
        };

        const service = new GetTalentPortfolios(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
            } as never),
        ).rejects.toThrow('No User ID Found!');

        expect(talentRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when talent not found', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn(),
        };

        const service = new GetTalentPortfolios(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { id: 'user-1' },
            } as never),
        ).rejects.toThrow('Talent not found');

        expect(talentPortfolioRepository.findByTalentId).not.toHaveBeenCalled();
    });

    it('returns empty portfolio list when no items exist', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
            }),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn().mockResolvedValue([]),
        };

        const service = new GetTalentPortfolios(talentPortfolioRepository as never, talentRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
        } as never);

        expect(response.data).toEqual([]);
    });
});
