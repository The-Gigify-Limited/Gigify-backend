import type { ControllerArgsTypes } from '@/core';
import { PaymentProviderEnum, PaymentStatusEnum } from './module.types';

export interface ProcessPaymentDto extends ControllerArgsTypes {
    input: {
        paymentId?: string;
        gigId?: string;
        applicationId?: string;
        talentId: string;
        amount: number;
        currency?: string;
        provider?: PaymentProviderEnum;
        paymentReference?: string;
        platformFee?: number;
        status?: PaymentStatusEnum;
    };
}

export interface CreateStripeCheckoutSessionDto extends ControllerArgsTypes {
    input: {
        paymentId?: string;
        gigId?: string;
        applicationId?: string;
        talentId: string;
        amount: number;
        currency?: string;
        platformFee?: number;
        successUrl?: string;
        cancelUrl?: string;
    };
}

export interface RequestPayoutDto extends ControllerArgsTypes {
    input: {
        amount: number;
        currency?: string;
        note?: string;
    };
}

export interface PaymentHistoryQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        dateFrom?: string;
        dateTo?: string;
        status?: 'pending' | 'processing' | 'paid' | 'released' | 'failed' | 'disputed' | 'refunded' | 'cancelled';
        direction?: 'incoming' | 'outgoing';
        gigId?: string;
    };
}

export interface PaymentReleaseParamsDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
}

export interface ConfirmPaymentReleaseDto extends ControllerArgsTypes {
    params: {
        id: string;
    };
    input: {
        otpCode: string;
    };
}
