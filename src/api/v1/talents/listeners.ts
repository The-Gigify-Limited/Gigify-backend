import { Talent, TalentProfile, TalentReview, TalentReviewSummary } from './interfaces';
import { TalentPortfolioRepository, TalentRepository, TalentReviewRepository } from './repository';

export async function createTalentEventListener(user_id: string): Promise<Talent | null> {
    const talentRepository = new TalentRepository();
    const existingTalent = await talentRepository.createTalentProfile(user_id);

    return existingTalent;
}

export async function getTalentProfileByUserId(user_id: string): Promise<TalentProfile | null> {
    const talentRepository = new TalentRepository();
    const talentPortfolioRepository = new TalentPortfolioRepository();
    const talentReviewRepository = new TalentReviewRepository();

    const existingTalent = await talentRepository.findByUserId(user_id);

    if (!existingTalent) return null;

    const talentPortfolios = await talentPortfolioRepository.findByTalentId(existingTalent?.id ?? '');
    const talentReviews = await talentReviewRepository.findMany({
        filters: {
            talent_id: user_id,
        },
        pagination: {
            page: 1,
            pageSize: 1,
        },
    });

    const convertedReviews = talentReviews?.map(talentReviewRepository.mapToCamelCase) ?? [];

    const averageRating = await talentReviewRepository.findTalentAverageRating(user_id);

    return {
        ...existingTalent,
        averageRating,
        reviews: convertedReviews,
        portfolios: talentPortfolios,
    };
}

export async function getTalentReviewsEventListener(input: {
    talentId: string;
    page?: number;
    pageSize?: number;
}): Promise<{ reviews: TalentReview[]; summary: TalentReviewSummary[] }> {
    const talentReviewRepository = new TalentReviewRepository();

    const reviews = await talentReviewRepository.findMany({
        filters: {
            talent_id: input.talentId,
        },
        pagination: {
            page: input.page ?? 1,
            pageSize: input.pageSize ?? 10,
        },
        orderBy: {
            column: 'created_at',
            ascending: false,
        },
    });

    const summary = await talentReviewRepository.findTalentRatingSummary(input.talentId);

    return {
        reviews: reviews.map(talentReviewRepository.mapToCamelCase),
        summary,
    };
}

export async function createTalentReviewEventListener(input: {
    revieweeId: string;
    reviewerId: string;
    gigId?: string;
    comment?: string;
    rating: number;
}): Promise<TalentReview | null> {
    const talentReviewRepository = new TalentReviewRepository();

    const createdReview = await talentReviewRepository.createTalentReview(input.revieweeId, {
        reviewerId: input.reviewerId,
        gigId: input.gigId,
        comment: input.comment,
        rating: input.rating,
    });

    return createdReview;
}
