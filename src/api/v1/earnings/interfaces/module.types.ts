import { DatabaseEnum, DatabaseTable, Json } from '@/core/types';

export type DatabasePayment = DatabaseTable['payments']['Row'];
export type DatabasePayoutRequest = DatabaseTable['payout_requests']['Row'];
export type DatabasePaymentReleaseOtp = DatabaseTable['payment_release_otps']['Row'];
export type DatabaseDispute = DatabaseTable['disputes']['Row'];
export type DatabaseDisputeEvidence = DatabaseTable['dispute_evidence']['Row'];

export type DisputeStatusEnum = 'open' | 'in_review' | 'resolved_talent' | 'resolved_employer' | 'withdrawn';
export type DisputeEvidenceTypeEnum = 'screenshot' | 'message' | 'document' | 'other';

export type Dispute = {
    id: string;
    paymentId: string | null;
    gigId: string | null;
    raisedBy: string | null;
    reason: string;
    description: string | null;
    status: DisputeStatusEnum;
    adminNotes: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type DisputeEvidence = {
    id: string;
    disputeId: string | null;
    uploadedBy: string | null;
    evidenceType: DisputeEvidenceTypeEnum | null;
    fileUrl: string | null;
    notes: string | null;
    createdAt: string | null;
};

export type PaymentStatusEnum = DatabaseEnum['payment_status'];
export type PaymentProviderEnum = DatabaseEnum['payment_provider'];
export type PayoutStatusEnum = DatabaseEnum['payout_status'];

export type Payment = {
    id: string;
    amount: number;
    applicationId: string | null;
    createdAt: string;
    currency: string;
    employerId: string;
    gigId: string | null;
    metadata: Json;
    paidAt: string | null;
    paymentReference: string | null;
    platformFee: number;
    provider: PaymentProviderEnum;
    status: PaymentStatusEnum;
    talentId: string;
    updatedAt: string;
};

export type PayoutExternalProviderEnum = 'stripe' | 'bank_wire' | 'paypal' | 'manual';

export type PayoutRequest = {
    id: string;
    amount: number;
    createdAt: string;
    currency: string;
    note: string | null;
    processedAt: string | null;
    status: PayoutStatusEnum;
    talentId: string;
    updatedAt: string;
    externalTransferId: string | null;
    externalProvider: PayoutExternalProviderEnum | null;
    paidAt: string | null;
    paidBy: string | null;
};

export type PaymentReleaseOtp = {
    id: string;
    paymentId: string;
    employerId: string;
    codeHash: string;
    expiresAt: string;
    attempts: number;
    consumedAt: string | null;
    lastSentAt: string;
    createdAt: string;
    updatedAt: string;
};

export type EarningsSummary = {
    totalEarned: number;
    pendingPayments: number;
    availableForPayout: number;
    totalRequestedPayouts: number;
    currency: string;
    payments: Payment[];
    payoutRequests: PayoutRequest[];
};
