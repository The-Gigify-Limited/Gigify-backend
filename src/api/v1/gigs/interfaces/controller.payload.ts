import type { ControllerArgsTypes } from '@/core';
import { ApplicationStatusEnum, Gig, GigStatusEnum, OfferStatusEnum, PaymentProviderEnum } from './module.types';

export interface GetGigParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface GetGigsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: GigStatusEnum;
        serviceId?: string;
        search?: string;
        location?: string;
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
        minBudget?: number;
        maxBudget?: number;
        dateFrom?: string;
        dateTo?: string;
        isRemote?: boolean;
        employerId?: string;
        eventType?: string;
        genres?: string[];
    };
}

export interface CreateGigDto extends ControllerArgsTypes {
    input: Pick<
        Gig,
        | 'title'
        | 'description'
        | 'budgetAmount'
        | 'currency'
        | 'gigDate'
        | 'serviceId'
        | 'venueName'
        | 'locationLatitude'
        | 'locationLongitude'
        | 'isRemote'
        | 'requiredTalentCount'
    >;
}

export interface UpdateGigDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: Partial<
        Pick<
            Gig,
            | 'title'
            | 'description'
            | 'budgetAmount'
            | 'currency'
            | 'gigDate'
            | 'serviceId'
            | 'venueName'
            | 'locationLatitude'
            | 'locationLongitude'
            | 'isRemote'
            | 'status'
            | 'requiredTalentCount'
        >
    >;
}

export interface ApplyToGigDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        proposalMessage?: string;
        proposedRate?: number;
        proposedCurrency?: string;
    };
}

export interface GetGigApplicationsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    query: {
        page?: number;
        pageSize?: number;
        status?: ApplicationStatusEnum;
    };
}

export interface UpdateGigStatusDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        status: GigStatusEnum;
        reason?: string;
    };
}

export interface UpdateApplicationStatusDto extends ControllerArgsTypes {
    params: {
        gigId: string;
        applicationId: string;
    };
    input: {
        status: Extract<ApplicationStatusEnum, 'shortlisted' | 'rejected'>;
        employerNotes?: string | null;
    };
}

export interface HireTalentDto extends ControllerArgsTypes {
    params: {
        id: string;
        talentId: string;
    };
    input: {
        amount?: number;
        currency?: string;
        provider?: PaymentProviderEnum;
        paymentReference?: string;
        platformFee?: number;
    };
}

export interface GetMyGigsDto extends ControllerArgsTypes {
    params: {
        status: 'applied' | 'upcoming' | 'active' | 'completed';
    };
    query: {
        page?: number;
        pageSize?: number;
    };
}

export interface SaveGigDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface GetSavedGigsDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
    };
}

export interface ReportTalentDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        talentId: string;
        category?: string | null;
        reason: string;
    };
}

export interface GetGigDiscoveryFeedDto extends ControllerArgsTypes {
    query: {
        limit?: number;
        pageSize?: number;
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
    };
}

export interface CreateGigOfferDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        talentId: string;
        message?: string | null;
        proposedRate?: number | null;
        currency?: string | null;
        expiresAt?: string | null;
    };
}

export interface GetGigOffersDto extends ControllerArgsTypes {
    params?: {
        id?: string;
    };
    query: {
        page?: number;
        pageSize?: number;
        status?: OfferStatusEnum;
        direction?: 'received' | 'sent' | 'all';
    };
}

export interface UpdateGigOfferDto extends ControllerArgsTypes {
    params: {
        offerId: string;
    };
    input: {
        status: Extract<OfferStatusEnum, 'accepted' | 'declined' | 'withdrawn'>;
    };
}
