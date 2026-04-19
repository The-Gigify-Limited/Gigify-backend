import { adminId, employerId, talentId } from './ids';
import { ensureAuthUser, log, SEED_PASSWORD, upsertIfAbsent } from './helpers';

export type SeedRole = 'employer' | 'talent' | 'admin';

export interface SeedPersona {
    id: string;
    email: string;
    role: SeedRole;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    bio: string;
    locationCity: string;
    locationCountry: string;
    onboardingStep: number;
    isVerified: boolean;
    status: 'active' | 'suspended';
    scenario: string;
}

// Every persona exists to exercise at least one API endpoint path. When adding
// a scenario, keep the `scenario` string grounded in what the data enables
// ("mid-checkout" vs "has a Stripe row") so downstream seed files can look up
// by intent rather than by id.
export const EMPLOYERS: SeedPersona[] = [
    mk('employer', 1, 'Ava', 'Okonkwo', 'ava', 'Active employer running multiple open gigs across Lagos.', 'Lagos', 'active'),
    mk('employer', 2, 'Ben', 'Adeyemi', 'ben', 'Has one gig fully completed and paid out end-to-end.', 'Lagos', 'active'),
    mk('employer', 3, 'Clara', 'Ojo', 'clara', 'Employer currently in an open dispute with a talent.', 'Abuja', 'active'),
    mk('employer', 4, 'Dayo', 'Musa', 'dayo', 'Signed up but has not completed KYC.', 'Ibadan', 'active', { onboardingStep: 1, isVerified: false }),
    mk('employer', 5, 'Eve', 'Nwosu', 'eve', 'Brand new account, no profile yet.', 'Port Harcourt', 'active', {
        onboardingStep: 0,
        isVerified: false,
    }),
    mk('employer', 6, 'Femi', 'Bello', 'femi', 'High-volume employer with 5+ gigs posted.', 'Lagos', 'active'),
    mk('employer', 7, 'Gina', 'Obi', 'gina', 'Has canceled gigs on record.', 'Enugu', 'active'),
    mk('employer', 8, 'Henry', 'Ade', 'henry', 'Mid-checkout on a Stripe escrow payment.', 'Lagos', 'active'),
    mk('employer', 9, 'Ibukun', 'Okafor', 'ibukun', 'Extended a counter-offer on a gig.', 'Abuja', 'active'),
    mk('employer', 10, 'Joy', 'Ibe', 'joy', 'Has multiple rejected applications.', 'Lagos', 'active'),
];

export const TALENTS: SeedPersona[] = [
    mk('talent', 1, 'Kola', 'Adebayo', 'kola', 'Verified DJ with reviews and a portfolio.', 'Lagos', 'active'),
    mk('talent', 2, 'Lara', 'Ogundele', 'lara', 'Verified MC with multiple completed gigs.', 'Abuja', 'active'),
    mk('talent', 3, 'Maxell', 'Chidi', 'maxell', 'Verified photographer with saved gigs.', 'Lagos', 'active'),
    mk('talent', 4, 'Nia', 'Bassey', 'nia', 'Currently hired on an active gig.', 'Lagos', 'active'),
    mk('talent', 5, 'Oba', 'Eze', 'oba', 'Hired by 2 employers in the last 30 days.', 'Kano', 'active'),
    mk('talent', 6, 'Peju', 'Akintola', 'peju', 'In progress on a shoot that has not yet been released.', 'Lagos', 'active'),
    mk('talent', 7, 'Qasim', 'Lawal', 'qasim', 'Has a pending payout request awaiting approval.', 'Abuja', 'active'),
    mk('talent', 8, 'Rita', 'Uche', 'rita', 'Payout paid out successfully with an external transfer id.', 'Lagos', 'active'),
    mk('talent', 9, 'Sade', 'Olowo', 'sade', 'Payout request was rejected by an admin.', 'Ibadan', 'active'),
    mk('talent', 10, 'Tomi', 'Ajayi', 'tomi', 'KYC session pending review.', 'Lagos', 'active', { isVerified: false }),
    mk('talent', 11, 'Uche', 'Nnamdi', 'uche', 'KYC approved, fully verified.', 'Abuja', 'active'),
    mk('talent', 12, 'Vivian', 'Bello', 'vivian', 'KYC rejected — needs resubmission.', 'Lagos', 'active', { isVerified: false }),
    mk('talent', 13, 'Wale', 'Oduya', 'wale', 'No KYC at all — cannot yet be hired.', 'Port Harcourt', 'active', {
        onboardingStep: 1,
        isVerified: false,
    }),
    mk('talent', 14, 'Xena', 'Okoye', 'xena', 'Has an open dispute on a paid gig.', 'Lagos', 'active'),
    mk('talent', 15, 'Yara', 'Ibrahim', 'yara', 'Has 5+ applications all rejected — cold-streak scenario.', 'Lagos', 'active'),
    mk('talent', 16, 'Zain', 'Musa', 'zain', 'Has archived threads and sent a typing indicator recently.', 'Abuja', 'active'),
    mk('talent', 17, 'Ada', 'Nwankwo', 'ada', 'Blocked another talent.', 'Lagos', 'active'),
    mk('talent', 18, 'Bode', 'Adigun', 'bode', 'Blocked BY another user.', 'Lagos', 'active'),
    mk('talent', 19, 'Chima', 'Obi', 'chima', 'Reported a message from a counterpart.', 'Lagos', 'active'),
    mk('talent', 20, 'Deola', 'Fawehinmi', 'deola', 'Has a default payout method + payout history.', 'Lagos', 'active'),
];

export const ADMINS: SeedPersona[] = [
    mk('admin', 1, 'Super', 'Admin', 'super.admin', 'Super admin with full access.', 'Lagos', 'active'),
    mk('admin', 2, 'Reg', 'Admin', 'reg.admin', 'Regular admin for moderation tasks.', 'Lagos', 'active'),
];

export const ALL_PERSONAS = [...EMPLOYERS, ...TALENTS, ...ADMINS];

function mk(
    role: SeedRole,
    n: number,
    firstName: string,
    lastName: string,
    usernameBase: string,
    scenario: string,
    city: string,
    status: 'active' | 'suspended',
    overrides: Partial<SeedPersona> = {},
): SeedPersona {
    const idFor = role === 'employer' ? employerId : role === 'talent' ? talentId : adminId;
    return {
        id: idFor(n),
        email: `seed.${role[0]}${n}@gigify.test`,
        role,
        firstName,
        lastName,
        username: `seed.${usernameBase}`,
        phoneNumber: formatPhone(role, n),
        bio: scenario,
        locationCity: city,
        locationCountry: 'Nigeria',
        onboardingStep: 3,
        isVerified: true,
        status,
        scenario,
        ...overrides,
    };
}

function formatPhone(role: SeedRole, n: number): string {
    const prefix = role === 'employer' ? '700' : role === 'talent' ? '800' : '900';
    return `+234${prefix}${n.toString().padStart(7, '0')}`;
}

export async function seedUsers(): Promise<void> {
    log('users', `ensuring ${ALL_PERSONAS.length} auth + public user rows`);

    for (const p of ALL_PERSONAS) {
        await ensureAuthUser({ id: p.id, email: p.email, password: SEED_PASSWORD });
    }

    const userRows = ALL_PERSONAS.map((p) => ({
        id: p.id,
        email: p.email,
        first_name: p.firstName,
        last_name: p.lastName,
        username: p.username,
        phone_number: p.phoneNumber,
        bio: p.bio,
        location_city: p.locationCity,
        location_country: p.locationCountry,
        onboarding_step: p.onboardingStep,
        role: p.role,
        status: p.status,
        is_verified: p.isVerified,
    }));
    await upsertIfAbsent('users', userRows, 'id');

    const employerProfiles = EMPLOYERS.filter((p) => p.onboardingStep >= 2).map((p) => ({
        user_id: p.id,
        organization_name: `${p.firstName} ${p.lastName} Events`,
        industry: 'Entertainment',
        company_website: `https://${p.username.replace(/\./g, '-')}.example.com`,
        total_gigs_posted: 0,
        total_spent: 0,
    }));
    await upsertIfAbsent('employer_profiles', employerProfiles, 'user_id');

    const talentProfiles = TALENTS.filter((p) => p.onboardingStep >= 2).map((p) => ({
        user_id: p.id,
        stage_name: `DJ ${p.firstName}`,
        primary_role: defaultRoleFor(p.id),
        biography: p.scenario,
        min_rate: 50000,
        max_rate: 250000,
        rate_currency: 'NGN',
        years_experience: 3,
        skills: ['performance', 'mixing', 'event-management'] as unknown as never,
    }));
    await upsertIfAbsent('talent_profiles', talentProfiles, 'user_id');

    log('users', 'done');
}

function defaultRoleFor(id: string): string {
    // Give each talent a slightly different primary role so search/filter
    // queries return varied results.
    const roles = ['DJ', 'MC', 'Photographer', 'Videographer', 'Dancer', 'Musician', 'Event Host', 'Sound Engineer', 'Lighting Tech', 'Decorator'];
    const tail = parseInt(id.slice(-4), 16);
    return roles[tail % roles.length];
}
