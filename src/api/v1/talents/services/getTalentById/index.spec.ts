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
    TalentPortfolioRepository: class TalentPortfolioRepository {},
    TalentReviewRepository: class TalentReviewRepository {},
}));

import { GetTalentById } from './index';

describe('GetTalentById service', () => {
    it('retrieves talent profile with portfolios, reviews, and completed gigs count', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
                bio: 'Talented designer',
            }),
            countCompletedGigs: jest.fn().mockResolvedValue(7),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn().mockResolvedValue([{ id: 'port-1', title: 'Project A', imageUrl: 'image.jpg' }]),
        };
        const talentReviewRepository = {
            findMany: jest.fn().mockResolvedValue([{ id: 'review-1', rating: 5, comment: 'Great work' }]),
            mapToCamelCase: jest.fn().mockImplementation((review) => review),
            findTalentAverageRating: jest.fn().mockResolvedValue(4.8),
        };

        const service = new GetTalentById(talentRepository as never, talentPortfolioRepository as never, talentReviewRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
        } as never);

        expect(talentRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(talentRepository.countCompletedGigs).toHaveBeenCalledWith('user-1');
        expect(talentPortfolioRepository.findByTalentId).toHaveBeenCalledWith('talent-1');
        expect(talentReviewRepository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: { talent_id: 'user-1' },
            }),
        );
        expect(talentReviewRepository.findTalentAverageRating).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Talent Retrieved Successfully');
        expect(response.data.portfolios).toHaveLength(1);
        expect(response.data.averageRating).toBe(4.8);
        expect(response.data.totalGigsCompleted).toBe(7);
    });

    it('throws when talent id is not provided', async () => {
        const talentRepository = {
            findByUserId: jest.fn(),
            countCompletedGigs: jest.fn(),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn(),
        };
        const talentReviewRepository = {
            findMany: jest.fn(),
            mapToCamelCase: jest.fn(),
            findTalentAverageRating: jest.fn(),
        };

        const service = new GetTalentById(talentRepository as never, talentPortfolioRepository as never, talentReviewRepository as never);

        await expect(
            service.handle({
                params: { id: undefined },
            } as never),
        ).rejects.toThrow('Talent user ID is required');

        expect(talentRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when talent profile not found', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
            countCompletedGigs: jest.fn(),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn(),
        };
        const talentReviewRepository = {
            findMany: jest.fn(),
            mapToCamelCase: jest.fn(),
            findTalentAverageRating: jest.fn(),
        };

        const service = new GetTalentById(talentRepository as never, talentPortfolioRepository as never, talentReviewRepository as never);

        await expect(
            service.handle({
                params: { id: 'user-1' },
            } as never),
        ).rejects.toThrow('Talent profile not found');

        expect(talentPortfolioRepository.findByTalentId).not.toHaveBeenCalled();
    });

    it('returns empty portfolios and reviews when none exist', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
                bio: 'Talented designer',
            }),
            countCompletedGigs: jest.fn().mockResolvedValue(0),
        };
        const talentPortfolioRepository = {
            findByTalentId: jest.fn().mockResolvedValue([]),
        };
        const talentReviewRepository = {
            findMany: jest.fn().mockResolvedValue([]),
            mapToCamelCase: jest.fn(),
            findTalentAverageRating: jest.fn().mockResolvedValue(null),
        };

        const service = new GetTalentById(talentRepository as never, talentPortfolioRepository as never, talentReviewRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
        } as never);

        expect(response.data.portfolios).toEqual([]);
        expect(response.data.reviews).toEqual([]);
        expect(response.data.averageRating).toBeNull();
    });
});
