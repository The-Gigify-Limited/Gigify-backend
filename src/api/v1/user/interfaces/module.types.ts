import { DatabaseEnum, DatabaseTable } from '@/core/types';

export type DatabaseUser = DatabaseTable['users']['Row'];
export type UserRoleEnum = DatabaseEnum['user_role'];
export type UserStatusEnum = DatabaseEnum['user_status'];

export type User = {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    fullAddress: string | null
    locationCity: string | null;
    locationCountry: string | null;
    postCode: number | null
    onboardingStep: number | null;
    role: UserRoleEnum;
    status: UserStatusEnum;
    isVerified: boolean;
    verified: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};


/**
 * Users
 * first name
 * last name
 * gender
 *  locationCity: string | null;
    locationCountry: string | null;
    post code
    address
    phoneNumber
 * 
 * Talents
 * date of birth
 * expertise
 * stage name
 * bio
 * 
 * Employers
 * company name
 * website link
 * 
 */