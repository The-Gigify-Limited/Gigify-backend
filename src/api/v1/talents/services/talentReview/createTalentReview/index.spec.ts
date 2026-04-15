jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { CREATED: 201 },
        UnAuthorizedError,
    };
});

jest.mock('~/talents/repository', () => ({
    TalentReviewRepository: class TalentReviewRepository {},
}));

import { CreateTalentReview } from './index';

describe('CreateTalentReview service', () => {
    it('creates a review for a talent', async () => {
        const talentReviewRepository = {
            createTalentReview: jest.fn().mockResolvedValue({
                id: 'review-1',
                talentId: 'talent-1',
                reviewerId: 'reviewer-1',
                rating: 5,
                comment: 'Great talent',
            }),
        };

        const service = new CreateTalentReview(talentReviewRepository as never);

        const response = await service.handle({
            params: { id: 'talent-1' },
            input: {
                rating: 5,
                comment: 'Great talent',
            },
            request: {
                user: { id: 'reviewer-1' },
            },
        } as never);

        expect(talentReviewRepository.createTalentReview).toHaveBeenCalledWith('talent-1', {
            rating: 5,
            comment: 'Great talent',
            reviewerId: 'reviewer-1',
        });
        expect(response.message).toBe('Review Created Successfully');
        expect(response.data.rating).toBe(5);
    });

    it('throws when user is not authenticated', async () => {
        const talentReviewRepository = {
            createTalentReview: jest.fn(),
        };

        const service = new CreateTalentReview(talentReviewRepository as never);

        await expect(
            service.handle({
                params: { id: 'talent-1' },
                input: { rating: 5, comment: 'Great' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(talentReviewRepository.createTalentReview).not.toHaveBeenCalled();
    });

    it('throws when review creation fails', async () => {
        const talentReviewRepository = {
            createTalentReview: jest.fn().mockResolvedValue(null),
        };

        const service = new CreateTalentReview(talentReviewRepository as never);

        await expect(
            service.handle({
                params: { id: 'talent-1' },
                input: { rating: 5, comment: 'Great' },
                request: {
                    user: { id: 'reviewer-1' },
                },
            } as never),
        ).rejects.toThrow('Failed to create review');
    });
});
