import { adminId, employerId, gigId, gigReportId, identityId, portfolioId, reviewId, talentId } from './ids';
import { log, upsertIfAbsent } from './helpers';

type VerificationStatus = 'pending' | 'approved' | 'rejected';
type IdentityDocumentType = 'passport' | 'drivers_license' | 'national_id' | 'selfie_video';
type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';

interface SeedReview {
    id: string;
    talentId: string;
    reviewerId: string;
    gigId: string;
    rating: number;
    comment: string;
}

const REVIEWS: SeedReview[] = [
    r(1, talentId(1), employerId(1), gigId(1), 5, 'Phenomenal DJ — kept the floor packed all night.'),
    r(2, talentId(3), employerId(2), gigId(3), 5, 'Professional, fast turnaround on photos.'),
    r(3, talentId(5), employerId(2), gigId(16), 4, 'Great AV support, minor sync issue on day two.'),
    r(4, talentId(4), employerId(6), gigId(7), 5, 'Led the crew exceptionally.'),
    r(5, talentId(2), employerId(6), gigId(5), 4, 'Great conference host, could be more spontaneous.'),
    r(6, talentId(1), employerId(6), gigId(8), 5, 'Booked again — easy to work with.'),
];

function r(n: number, talent: string, reviewer: string, gig: string, rating: number, comment: string): SeedReview {
    return { id: reviewId(n), talentId: talent, reviewerId: reviewer, gigId: gig, rating, comment };
}

interface SeedPortfolio {
    id: string;
    talentId: string;
    portfolioUrl: string;
    viewCount: number;
}

const PORTFOLIOS: SeedPortfolio[] = [
    { id: portfolioId(1), talentId: talentId(1), portfolioUrl: 'https://seed.example.com/kola/mix-1', viewCount: 142 },
    { id: portfolioId(2), talentId: talentId(1), portfolioUrl: 'https://seed.example.com/kola/mix-2', viewCount: 88 },
    { id: portfolioId(3), talentId: talentId(2), portfolioUrl: 'https://seed.example.com/lara/conference-reel', viewCount: 230 },
    { id: portfolioId(4), talentId: talentId(3), portfolioUrl: 'https://seed.example.com/maxell/wedding-gallery', viewCount: 410 },
    { id: portfolioId(5), talentId: talentId(5), portfolioUrl: 'https://seed.example.com/oba/retreat-av', viewCount: 58 },
    { id: portfolioId(6), talentId: talentId(11), portfolioUrl: 'https://seed.example.com/uche/verified-reel', viewCount: 20 },
];

interface SeedIdentity {
    id: string;
    userId: string;
    idType: IdentityDocumentType;
    mediaUrl: string;
    selfieUrl: string | null;
    status: VerificationStatus;
    notes: string | null;
    reviewedAt: string | null;
}

// Every verification_status is represented.
const IDENTITIES: SeedIdentity[] = [
    {
        id: identityId(1),
        userId: talentId(10),
        idType: 'national_id',
        mediaUrl: 'https://seed.example.com/kyc/tomi-nin.png',
        selfieUrl: 'https://seed.example.com/kyc/tomi-selfie.png',
        status: 'pending',
        notes: null,
        reviewedAt: null,
    },
    {
        id: identityId(2),
        userId: talentId(11),
        idType: 'passport',
        mediaUrl: 'https://seed.example.com/kyc/uche-passport.png',
        selfieUrl: 'https://seed.example.com/kyc/uche-selfie.png',
        status: 'approved',
        notes: 'Verified by admin.',
        reviewedAt: new Date().toISOString(),
    },
    {
        id: identityId(3),
        userId: talentId(12),
        idType: 'drivers_license',
        mediaUrl: 'https://seed.example.com/kyc/vivian-license.png',
        selfieUrl: null,
        status: 'rejected',
        notes: 'Image too blurry — resubmit.',
        reviewedAt: new Date().toISOString(),
    },
    {
        id: identityId(4),
        userId: employerId(4),
        idType: 'national_id',
        mediaUrl: 'https://seed.example.com/kyc/dayo-nin.png',
        selfieUrl: null,
        status: 'pending',
        notes: null,
        reviewedAt: null,
    },
];

interface SeedGigReport {
    id: string;
    gigId: string;
    reporterId: string;
    reportedUserId: string;
    category: string;
    reason: string;
    status: ReportStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    resolutionNote: string | null;
}

const GIG_REPORTS: SeedGigReport[] = [
    {
        id: gigReportId(1),
        gigId: gigId(14),
        reporterId: talentId(15),
        reportedUserId: employerId(10),
        category: 'misleading_listing',
        reason: 'Budget range is suspiciously low for the scope described.',
        status: 'open',
        reviewedBy: null,
        reviewedAt: null,
        resolutionNote: null,
    },
    {
        id: gigReportId(2),
        gigId: gigId(4),
        reporterId: talentId(14),
        reportedUserId: employerId(3),
        category: 'harassment',
        reason: 'Rude communication during the dispute.',
        status: 'in_review',
        reviewedBy: adminId(2),
        reviewedAt: new Date().toISOString(),
        resolutionNote: null,
    },
    {
        id: gigReportId(3),
        gigId: gigId(11),
        reporterId: talentId(5),
        reportedUserId: employerId(7),
        category: 'ghosting',
        reason: 'No response after offer.',
        status: 'resolved',
        reviewedBy: adminId(1),
        reviewedAt: new Date().toISOString(),
        resolutionNote: 'Spoke with employer, issue resolved.',
    },
    {
        id: gigReportId(4),
        gigId: gigId(10),
        reporterId: talentId(2),
        reportedUserId: employerId(7),
        category: 'spam',
        reason: 'Repeated cancellations.',
        status: 'dismissed',
        reviewedBy: adminId(1),
        reviewedAt: new Date().toISOString(),
        resolutionNote: 'No pattern of abuse detected.',
    },
];

export async function seedMisc(): Promise<void> {
    log('misc', `upserting reviews / portfolios / identity verifications / gig reports`);

    const reviewRows = REVIEWS.map((rev) => ({
        id: rev.id,
        talent_id: rev.talentId,
        reviewer_id: rev.reviewerId,
        gig_id: rev.gigId,
        rating: rev.rating,
        comment: rev.comment,
    }));
    await upsertIfAbsent('talent_reviews', reviewRows, 'id');

    const portfolioRows = PORTFOLIOS.map((p) => ({
        id: p.id,
        talent_id: p.talentId,
        portfolio_url: p.portfolioUrl,
        view_count: p.viewCount,
    }));
    await upsertIfAbsent('talent_portfolios', portfolioRows, 'id');

    const identityRows = IDENTITIES.map((iv) => ({
        id: iv.id,
        user_id: iv.userId,
        id_type: iv.idType,
        media_url: iv.mediaUrl,
        selfie_url: iv.selfieUrl,
        status: iv.status,
        notes: iv.notes,
        reviewed_at: iv.reviewedAt,
    }));
    await upsertIfAbsent('identity_verifications', identityRows, 'id');

    const reportRows = GIG_REPORTS.map((rep) => ({
        id: rep.id,
        gig_id: rep.gigId,
        reporter_id: rep.reporterId,
        reported_user_id: rep.reportedUserId,
        category: rep.category,
        reason: rep.reason,
        status: rep.status,
        reviewed_by: rep.reviewedBy,
        reviewed_at: rep.reviewedAt,
        resolution_note: rep.resolutionNote,
    }));
    await upsertIfAbsent('reports', reportRows, 'id');

    log('misc', 'done');
}
