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
    updatedAt: string | null;
};

export type EmployerDashboard = {
    profile: EmployerProfile;
    openGigs: number;
    inProgressGigs: number;
    completedGigs: number;
    pendingApplications: number;
    pendingPayments: number;
};
