import { DatabaseTable } from '@/core/types';

export type DatabaseTalent = DatabaseTable['talent_profiles']['Row'];
export type DatabaseTalentPortfolio = DatabaseTable['talent_portfolios']['Row'];
export type DatabaseTalentReview = DatabaseTable['talent_reviews']['Row'];
export type DatabaseSavedTalent = DatabaseTable['saved_talents']['Row'];
export type DatabaseTalentAvailability = DatabaseTable['talent_availability']['Row'];

export type SavedTalent = {
    id: string;
    userId: string;
    talentId: string;
    createdAt: string;
};

export type TalentAvailability = {
    id: string;
    talentUserId: string;
    unavailableFrom: string;
    unavailableUntil: string;
    reason: string | null;
    source: 'manual' | 'auto_from_gig';
    gigId: string | null;
    createdAt: string;
};

export type Talent = {
    id: string;
    userId: string;
    bannerUrl: string | null;
    biography: string | null;
    dateOfBirth: string | null;
    maxRate: number | null;
    minRate: number;
    primaryRole: string | null;
    rateCurrency: string;
    skills: string[] | null;
    stageName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    updatedAt: string | null;
    yearsExperience: number | null;
};

export type TalentPortfolio = {
    id: string;
    talentId: string;
    portfolioUrl: string | null;
    viewCount: number;
};

export type TalentReview = {
    id: string;
    talentId: string;
    reviewerId: string | null;
    gigId: string | null;
    comment: string | null;
    rating: number;
    createdAt: string | null;
    updatedAt: string | null;
};

export type TalentReviewSummary = {
    rating: number;
    count: number;
};

export type TalentProfile = Talent & {
    averageRating: number;
    portfolios: TalentPortfolio[];
    reviews: TalentReview[];
};
