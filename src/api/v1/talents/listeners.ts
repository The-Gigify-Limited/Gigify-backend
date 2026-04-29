import { logger } from '@/core';
import { GigRepository } from '~/gigs/repository';
import { Talent, TalentProfile, TalentReview, TalentReviewSummary } from './interfaces';
import { AvailabilityRepository, TalentPortfolioRepository, TalentRepository, TalentReviewRepository } from './repository';

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

    const [talentPortfolios, talentReviews, averageRating, totalGigsCompleted] = await Promise.all([
        talentPortfolioRepository.findByTalentId(existingTalent?.id ?? ''),
        talentReviewRepository.findMany({
            filters: {
                talent_id: user_id,
            },
            pagination: {
                page: 1,
                pageSize: 1,
            },
        }),
        talentReviewRepository.findTalentAverageRating(user_id),
        talentRepository.countCompletedGigs(user_id),
    ]);

    const convertedReviews = talentReviews?.map(talentReviewRepository.mapToCamelCase) ?? [];

    return {
        ...existingTalent,
        averageRating,
        reviews: convertedReviews,
        portfolios: talentPortfolios,
        totalGigsCompleted,
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

// Mirrors an accepted offer into the talent's availability calendar so
// browse filters with `availableOn=<gig date>` exclude booked talents. The
// row has source=auto_from_gig which also prevents the talent from deleting
// it out-of-band from /talent/availability/:id.
export async function autoBlockAvailabilityOnOfferAcceptedListener(input: { gigId: string; talentId: string }): Promise<void> {
    try {
        const gigRepository = new GigRepository();
        const availabilityRepository = new AvailabilityRepository();

        const gig = await gigRepository.getGigById(input.gigId);
        if (!gig?.gigDate) {
            logger.warn('Cannot auto-block availability: gig has no gig_date', { gigId: input.gigId });
            return;
        }

        const { unavailableFrom, unavailableUntil } = resolveBusyWindow(gig.gigDate, gig.gigStartTime ?? null, gig.gigEndTime ?? null);

        await availabilityRepository.addAutoFromGig({
            talentUserId: input.talentId,
            gigId: input.gigId,
            unavailableFrom,
            unavailableUntil,
        });
    } catch (error) {
        logger.error('Failed to auto-block talent availability on offer accept', {
            gigId: input.gigId,
            talentId: input.talentId,
            error: String(error),
        });
    }
}

// When a dispute is resolved in the employer's favour the booking
// effectively didn't happen — we free the talent's calendar so they're
// bookable again on that date. For resolved_talent / withdrawn the busy
// window stays, since the talent did fulfil (or begin to fulfil) the gig.
export async function unblockAvailabilityOnDisputeResolvedListener(input: {
    gigId: string | null;
    resolution: 'resolved_talent' | 'resolved_employer' | 'withdrawn';
}): Promise<void> {
    if (input.resolution !== 'resolved_employer' || !input.gigId) return;
    try {
        const availabilityRepository = new AvailabilityRepository();
        await availabilityRepository.deleteAutoForGig(input.gigId);
    } catch (error) {
        logger.error('Failed to unblock talent availability on dispute resolve', {
            gigId: input.gigId,
            resolution: input.resolution,
            error: String(error),
        });
    }
}

function resolveBusyWindow(gigDate: string, startTime: string | null, endTime: string | null): { unavailableFrom: string; unavailableUntil: string } {
    // gigDate is a DATE (YYYY-MM-DD). If start / end times are populated we
    // narrow to the actual working window; otherwise we block the full day.
    const base = gigDate;
    const from = startTime ? new Date(`${base}T${startTime}`) : new Date(`${base}T00:00:00`);
    const until = endTime ? new Date(`${base}T${endTime}`) : new Date(`${base}T23:59:59`);

    // Safety net: if endTime <= startTime (overnight gig) push end to next day.
    if (until <= from) {
        until.setDate(until.getDate() + 1);
    }

    return { unavailableFrom: from.toISOString(), unavailableUntil: until.toISOString() };
}
