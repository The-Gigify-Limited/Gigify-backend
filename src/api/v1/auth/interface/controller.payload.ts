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
        email: string;
        code: string;
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
