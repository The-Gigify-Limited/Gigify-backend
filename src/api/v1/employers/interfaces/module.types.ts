import { DatabaseTable } from '@/core/types';

export type DatabaseEmployerProfile = DatabaseTable['employer_profiles']['Row'];

export type EmployerProfile = {
    id: string;
    userId: string;
    organizationName: string | null;
    companyWebsite: string | null;
    industry: string | null;
    totalGigsPosted: number | null;
    totalSpent: number | null;
    // Computed on the fly by services that fetch this profile, not stored in
    // the employer_profiles table, left optional so lightweight repository
    // methods don't have to do an extra count when nobody's reading the stat.
    totalApplicationsReceived?: number;
    updatedAt: string | null;
};

export type EmployerDashboard = {
    profile: EmployerProfile;
    openGigs: number;
    inProgressGigs: number;
    completedGigs: number;
    pendingApplications: number;
    pendingPayments: number;
    totalApplicationsReceived: number;
};
