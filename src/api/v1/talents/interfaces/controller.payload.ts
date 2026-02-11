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

// TALENT REVIEWS
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
