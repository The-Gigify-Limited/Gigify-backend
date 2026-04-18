import type { ControllerArgsTypes } from '@/core';
import { UserRoleEnum } from '~/user/interfaces';

export interface LoginPayload extends ControllerArgsTypes {
    input: {
        email: string;
        password: string;
    };
}

export interface SignupPayload extends ControllerArgsTypes {
    input: {
        email: string;
        password: string;
    };
}

export interface RequestPhoneOtpPayload extends ControllerArgsTypes {
    input: {
        phoneNumber: string;
    };
}

export interface VerifyPhoneOtpPayload extends ControllerArgsTypes {
    input: {
        phoneNumber: string;
        otp: string;
    };
}

export interface GoogleAuthUrlPayload extends ControllerArgsTypes {
    input: {
        redirectTo?: string;
    };
}

export interface GoogleAuthCodeExchangePayload extends ControllerArgsTypes {
    input: {
        code: string;
    };
}

export interface SetUserRolePayload extends ControllerArgsTypes {
    input: {
        userId: string;
        role: UserRoleEnum;
    };
}

export interface ForgotPasswordPayload extends ControllerArgsTypes {
    input: { email: string };
}

export interface ResetPasswordPayload extends ControllerArgsTypes {
    input: {
        password: string;
    };
}

export interface VerifyEmailPayload extends ControllerArgsTypes {
    input: {
        email: string;
        otp: string;
    };
}

export interface ResendVerifyEmailPayload extends ControllerArgsTypes {
    input: {
        email: string;
    };
}

export interface RefreshTokenPayload extends ControllerArgsTypes {
    input: {
        refreshToken: string;
    };
}
