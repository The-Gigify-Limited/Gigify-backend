import { DatabaseTable } from '@/core/types';

export type DatabaseTalent = DatabaseTable['talent_profiles']['Row'];
export type DatabaseTalentPortfolio = DatabaseTable['talent_portfolios']['Row'];
export type DatabaseTalentReview = DatabaseTable['talent_reviews']['Row'];

export type Talent = {
    id: string;
    userId: string;
    dateOfBirth: string | null;
    skills: string[];
    stageName: string | null;
    biography: string | null;
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
