import { DatabaseEnum, DatabaseTable, Json } from '@/core/types';

export type DatabaseUser = DatabaseTable['users']['Row'];
export type DatabaseActivity = DatabaseTable['activities']['Row'];
export type DatabaseIdentityVerification = DatabaseTable['identity_verifications']['Row'];
export type DatabaseNotificationPreferences = DatabaseTable['notification_preferences']['Row'];
export type UserRoleEnum = DatabaseEnum['user_role'];
export type UserStatusEnum = DatabaseEnum['user_status'];
export type ActivityTypeEnum = DatabaseEnum['activity_type'];
export type IdentityDocumentTypeEnum = DatabaseEnum['identity_document_type'];
export type IdentityVerificationStatusEnum = DatabaseEnum['verification_status'];
export type IdentityVerificationProvider = 'manual' | 'sumsub';

export type User = {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    fullAddress: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
    postCode: number | null;
    onboardingStep: number | null;
    role: UserRoleEnum;
    status: UserStatusEnum;
    isVerified: boolean;
    verified: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    username: string | null;
};

export type Activity = {
    id: string;
    userId: string;
    eventType: ActivityTypeEnum;
    referenceId: string | null;
    metadata: Json | null;
    createdAt: string | null;
};

export type NotificationPreferences = {
    userId: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    marketingEnabled: boolean;
    gigUpdates: boolean;
    paymentUpdates: boolean;
    messageUpdates: boolean;
    securityAlerts: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};

export type IdentityVerification = {
    id: string;
    userId: string;
    idType: IdentityDocumentTypeEnum | null;
    mediaUrl: string | null;
    selfieUrl: string | null;
    provider: IdentityVerificationProvider;
    providerApplicantId: string | null;
    providerLevelName: string | null;
    providerPayload: Json | null;
    providerReviewResult: string | null;
    providerReviewStatus: string | null;
    status: IdentityVerificationStatusEnum;
    notes: string | null;
    reviewedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type SubmitIdentityVerificationInput = {
    idType: IdentityDocumentTypeEnum;
    mediaUrl: string;
    selfieUrl?: string | null;
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
