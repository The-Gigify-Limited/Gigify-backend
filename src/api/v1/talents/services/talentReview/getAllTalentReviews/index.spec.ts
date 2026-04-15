jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('~/talents/repository', () => ({
    TalentReviewRepository: class TalentReviewRepository {},
}));

import { GetTalentReviews } from './index';

describe('GetTalentReviews service', () => {
    it('retrieves talent reviews with rating summary', async () => {
        const talentReviewRepository = {
            findMany: jest.fn().mockResolvedValue([
                { id: 'review-1', talent_id: 'talent-1', rating: 5, comment: 'Great work' },
                { id: 'review-2', talent_id: 'talent-1', rating: 4, comment: 'Good job' },
            ]),
            mapToCamelCase: jest.fn().mockImplementation((review) => review),
            findTalentRatingSummary: jest.fn().mockResolvedValue({
                rating: 4.5,
                count: 2,
            }),
        };

        const service = new GetTalentReviews(talentReviewRepository as never);

        const response = await service.handle({
            params: { id: 'talent-1' },
            query: { page: 1, pageSize: 10 },
        } as never);

        expect(talentReviewRepository.findMany).toHaveBeenCalledWith({
            filters: { talent_id: 'talent-1' },
            pagination: { page: 1, pageSize: 10 },
        });
        expect(talentReviewRepository.findTalentRatingSummary).toHaveBeenCalledWith('talent-1');
        expect(response.message).toBe('Talent Reviews Retrieved Successfully');
        expect(response.data.reviews).toHaveLength(2);
        expect(response.data.summary[0]!.rating).toBe(4.5);
    });

    it('uses default pagination values', async () => {
        const talentReviewRepository = {
            findMany: jest.fn().mockResolvedValue([]),
            mapToCamelCase: jest.fn(),
            findTalentRatingSummary: jest.fn().mockResolvedValue(null),
        };

        const service = new GetTalentReviews(talentReviewRepository as never);

        await service.handle({
            params: { id: 'talent-1' },
            query: {},
        } as never);

        expect(talentReviewRepository.findMany).toHaveBeenCalledWith({
            filters: { talent_id: 'talent-1' },
            pagination: { page: 1, pageSize: 10 },
        });
    });

    it('returns empty reviews when none exist', async () => {
        const talentReviewRepository = {
            findMany: jest.fn().mockResolvedValue(null),
            mapToCamelCase: jest.fn(),
            findTalentRatingSummary: jest.fn().mockResolvedValue(null),
        };

        const service = new GetTalentReviews(talentReviewRepository as never);

        const response = await service.handle({
            params: { id: 'talent-1' },
            query: {},
        } as never);

        expect(response.data.reviews).toEqual([]);
        expect(response.data.summary).toBeNull();
    });
});
