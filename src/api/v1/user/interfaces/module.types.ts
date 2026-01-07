import { DatabaseEnum, DatabaseTable } from '@/core/types';

export type DatabaseUser = DatabaseTable['users']['Row'];
export type UserRoleEnum = DatabaseEnum['user_role'];
export type UserStatusEnum = DatabaseEnum['user_status'];

export type User = {
    id: string;
    email: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    onboardingStep: number | null;
    role: UserRoleEnum;
    status: UserStatusEnum;
    isVerified: boolean;
    verified: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};
