import { DatabaseEnum, DatabaseTable, Json } from '@/core/types';

export type DatabasePayment = DatabaseTable['payments']['Row'];
export type DatabasePayoutRequest = DatabaseTable['payout_requests']['Row'];
export type DatabasePaymentReleaseOtp = DatabaseTable['payment_release_otps']['Row'];

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
