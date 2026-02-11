import { Talent, TalentProfile } from './interfaces';
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
            talent_id: existingTalent?.id,
        },
        pagination: {
            page: 1,
            pageSize: 1,
        },
    });

    const convertedReviews = talentReviews?.map(talentReviewRepository.mapToCamelCase) ?? [];

    const averageRating = await talentReviewRepository.findTalentAverageRating(existingTalent?.id ?? '');

    return {
        ...existingTalent,
        averageRating,
        reviews: convertedReviews,
        portfolios: talentPortfolios,
    };
}
