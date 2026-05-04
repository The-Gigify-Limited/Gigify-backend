import type { ControllerArgsTypes } from '@/core';
import { Talent } from './module.types';

export interface GetTalentsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        search?: string;
    };
}

export interface GetTalentParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface TalentParamDTO extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface TalentPortfolioParamDTO extends ControllerArgsTypes {
    params: {
        talentPortfolioId: string;
    };
}

export interface UpdateTalentDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: Partial<Talent>;
}

export interface CreateTalentReviewDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        reviewerId: string | null;
        gigId?: string;
        comment?: string;
        rating: number;
    };
}

export interface GetTalentsReviewsQueryDto extends ControllerArgsTypes {
    params: {
        id: string;
    };

    query: {
        page?: number;
        pageSize?: number;
        sort_by?: string;
    };
}

export type BrowseSortBy = 'rating' | 'priceAsc' | 'priceDesc' | 'recent';

export interface BrowseTalentsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        search?: string;
        primaryRole?: string;
        genres?: string[];
        minRate?: number;
        maxRate?: number;
        rateCurrency?: string;
        minRating?: number;
        locationCity?: string;
        locationCountry?: string;
        radiusKm?: number;
        lat?: number;
        lng?: number;
        availableOn?: string;
        sortBy?: BrowseSortBy;
    };
}

export interface SavedTalentParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface SavedTalentsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
    };
}

export interface ListAvailabilityDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    query: {
        from?: string;
        to?: string;
    };
}

export interface AddAvailabilityDto extends ControllerArgsTypes {
    input: {
        unavailableFrom: string;
        unavailableUntil: string;
        reason?: string | null;
    };
}

export interface DeleteAvailabilityDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}
