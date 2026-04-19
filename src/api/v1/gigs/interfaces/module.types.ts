import { DatabaseEnum, DatabaseTable, Json } from '@/core/types';

export type DatabaseGig = DatabaseTable['gigs']['Row'];
export type DatabaseGigApplication = DatabaseTable['gig_applications']['Row'];
export type DatabaseGigOffer = DatabaseTable['gig_offers']['Row'];
export type DatabaseReport = DatabaseTable['reports']['Row'];
export type DatabaseSavedGig = DatabaseTable['saved_gigs']['Row'];
export type DatabaseServiceCatalog = DatabaseTable['services_catalog']['Row'];

export type GigStatusEnum = DatabaseEnum['gig_status'];
export type GigFrontendStatus = 'unpublished' | 'active' | 'booked' | 'completed' | 'cancelled' | 'expired';
export type ApplicationStatusEnum = DatabaseEnum['application_status'];
export type OfferStatusEnum = DatabaseEnum['offer_status'];
export type PaymentProviderEnum = DatabaseEnum['payment_provider'];
export type ReportStatusEnum = DatabaseEnum['report_status'];

export type Gig = {
    id: string;
    employerId: string;
    title: string;
    description: string | null;
    budgetAmount: number;
    currency: string | null;
    gigDate: string;
    status: GigStatusEnum | null;
    serviceId: string | null;
    venueName: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
    isRemote: boolean | null;
    requiredTalentCount: number;
    createdAt: string | null;
    updatedAt: string | null;
    eventType: string | null;
    startTime: string | null;
    endTime: string | null;
    durationMinutes: number | null;
    equipmentProvided: boolean | null;
    dressCode: string | null;
    additionalNotes: string | null;
};

export type GigApplication = {
    id: string;
    gigId: string;
    talentId: string;
    status: ApplicationStatusEnum;
    proposalMessage: string | null;
    proposedRate: number | null;
    proposedCurrency: string | null;
    employerNotes: string | null;
    appliedAt: string;
    hiredAt: string | null;
    updatedAt: string;
};

export type GigOffer = {
    id: string;
    gigId: string;
    employerId: string;
    talentId: string;
    message: string | null;
    proposedRate: number | null;
    currency: string;
    status: OfferStatusEnum;
    expiresAt: string | null;
    respondedAt: string | null;
    acceptedAt: string | null;
    declinedAt: string | null;
    counterAmount: number | null;
    counterMessage: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ServiceCatalog = {
    id: string;
    name: string;
    category: string | null;
    iconUrl: string | null;
    isActive: boolean | null;
    createdAt: string | null;
};

export type GigDetails = Gig & {
    service: ServiceCatalog | null;
    employer: Record<string, unknown> | null;
    employerProfile: Record<string, unknown> | null;
    myApplication: GigApplication | null;
};

export type TalentGigItem = {
    application: GigApplication;
    gig: Gig | null;
};

export type SavedGig = {
    id: string;
    userId: string;
    gigId: string;
    createdAt: string;
};

export type GigOfferWithContext = GigOffer & {
    gig: Gig | null;
    employer?: Record<string, unknown> | null;
    talent?: Record<string, unknown> | null;
};

export type GigReport = {
    id: string;
    gigId: string | null;
    reporterId: string;
    reportedUserId: string;
    category: string | null;
    reason: string;
    status: ReportStatusEnum;
    resolutionNote: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PaymentContext = {
    amount: number;
    applicationId?: string | null;
    currency?: string | null;
    gigId?: string | null;
    metadata?: Json | null;
    paymentReference?: string | null;
    platformFee?: number;
    provider?: PaymentProviderEnum;
    status?: 'pending' | 'processing' | 'paid';
    talentId: string;
};
