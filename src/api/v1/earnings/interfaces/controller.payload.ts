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
