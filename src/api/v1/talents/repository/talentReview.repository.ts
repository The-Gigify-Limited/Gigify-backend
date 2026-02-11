import { BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseTalentReview, TalentReview, TalentReviewSummary } from '../interfaces';

export class TalentReviewRepository extends BaseRepository<DatabaseTalentReview, TalentReview> {
    protected readonly table = 'talent_reviews' as const;

    constructor() {
        super();
    }

    async findByTalentId(talentId: string): Promise<TalentReview[]> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('talent_id', talentId);

        if (error) throw error;

        const convertedReviews = data?.map(this.mapToCamelCase) ?? [];

        return convertedReviews;
    }

    async findTalentAverageRating(talentId: string): Promise<number> {
        const { data: avgData, error: avgError } = await supabaseAdmin.rpc('get_talent_avg_rating', { tid: talentId });

        if (avgError) throw avgError;

        return avgData as number;
    }

    async findTalentRatingSummary(talentId: string): Promise<TalentReviewSummary[]> {
        const { data, error } = await supabaseAdmin.rpc('get_talent_rating_summary_full', { tid: talentId });

        if (error) throw error;

        return data;
    }

    async createTalentReview(talentId: string, review: Partial<TalentReview>): Promise<TalentReview | null> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                talent_id: talentId,
                reviewer_id: review.reviewerId!,
                gig_id: review.gigId,
                comment: review.comment,
                rating: review.rating!,
            })
            .select()
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data ? this.mapToCamelCase(data) : null;
    }
}

const talentReviewRepository = new TalentReviewRepository();
export default talentReviewRepository;
