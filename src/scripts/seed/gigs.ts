import { applicationId, employerId, gigId, offerId, savedGigId, talentId } from './ids';
import { log, upsertIfAbsent } from './helpers';

type GigStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired' | 'disputed';
type ApplicationStatus = 'submitted' | 'reviewing' | 'shortlisted' | 'hired' | 'rejected' | 'withdrawn';
type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired' | 'countered';

interface SeedGig {
    id: string;
    employerId: string;
    title: string;
    description: string;
    status: GigStatus;
    budget: number;
    currency: string;
    city: string;
    isRemote: boolean;
    eventType: string;
    gigDate: string;
}

// Gigs are indexed to personas so downstream seed files can wire payments,
// conversations, disputes, etc. without guessing. Statuses cover every
// `gig_status` enum value at least once.
export const GIGS: SeedGig[] = [
    g(
        1,
        employerId(1),
        'Corporate Launch DJ Night',
        'Launch event at V Towers Lagos.',
        'open',
        450_000,
        'NGN',
        'Lagos',
        false,
        'corporate_launch',
        '+14 days',
    ),
    g(
        2,
        employerId(1),
        'Friday Happy Hour MC',
        'Weekly MC gig for our Lagos office.',
        'open',
        120_000,
        'NGN',
        'Lagos',
        false,
        'corporate_hour',
        '+7 days',
    ),
    g(
        3,
        employerId(2),
        'Beach Wedding Photographer',
        'Full-day wedding shoot on Elegushi beach.',
        'completed',
        600_000,
        'NGN',
        'Lagos',
        false,
        'wedding',
        '-21 days',
    ),
    g(
        4,
        employerId(3),
        'Birthday Party Videographer',
        'Highlight reel for a 30th birthday.',
        'disputed',
        250_000,
        'NGN',
        'Abuja',
        false,
        'birthday',
        '-10 days',
    ),
    g(5, employerId(6), 'Tech Conference Host', 'Two-day conference anchoring.', 'open', 1_200_000, 'NGN', 'Lagos', false, 'conference', '+21 days'),
    g(
        6,
        employerId(6),
        'Product Shoot Photographer',
        'Studio shoot for a fintech brand.',
        'open',
        350_000,
        'NGN',
        'Lagos',
        false,
        'studio',
        '+5 days',
    ),
    g(
        7,
        employerId(6),
        'Music Video Dancers',
        'Afrobeats music video — 4 dancers.',
        'in_progress',
        800_000,
        'NGN',
        'Lagos',
        false,
        'music_video',
        '+2 days',
    ),
    g(8, employerId(6), 'Store Opening DJ', 'In-store launch event.', 'open', 180_000, 'NGN', 'Lagos', false, 'retail_launch', '+30 days'),
    g(
        9,
        employerId(6),
        'Fashion Show Lighting Tech',
        'Runway lighting for a boutique show.',
        'open',
        420_000,
        'NGN',
        'Lagos',
        false,
        'fashion',
        '+45 days',
    ),
    g(
        10,
        employerId(7),
        'Birthday Brunch MC (cancelled)',
        'Intimate 40-person brunch.',
        'cancelled',
        90_000,
        'NGN',
        'Enugu',
        false,
        'birthday',
        '-5 days',
    ),
    g(
        11,
        employerId(7),
        'Outdoor Festival (expired)',
        'Two-stage outdoor festival anchor.',
        'expired',
        950_000,
        'NGN',
        'Enugu',
        false,
        'festival',
        '-60 days',
    ),
    g(12, employerId(8), 'Cocktail Mixologist', 'Two-hour tasting reception.', 'open', 200_000, 'NGN', 'Lagos', false, 'corporate_mixer', '+9 days'),
    g(
        13,
        employerId(9),
        'Engagement Party Photographer',
        'Surprise engagement — outdoor.',
        'open',
        300_000,
        'NGN',
        'Abuja',
        false,
        'engagement',
        '+12 days',
    ),
    g(14, employerId(10), 'NYE Countdown Host', 'High-energy NYE rooftop.', 'open', 500_000, 'NGN', 'Lagos', false, 'nye', '+80 days'),
    g(15, employerId(10), 'Podcast Audio Engineer', 'Remote mixing for 8 episodes.', 'open', 400_000, 'NGN', 'Lagos', true, 'podcast', '+25 days'),
    g(
        16,
        employerId(2),
        'Corporate Retreat Sound',
        'Three-day retreat AV support.',
        'completed',
        700_000,
        'NGN',
        'Abuja',
        false,
        'retreat',
        '-45 days',
    ),
    g(17, employerId(1), 'Community Event DJ (draft)', 'Pop-up park event.', 'draft', 150_000, 'NGN', 'Lagos', false, 'community', '+60 days'),
    g(18, employerId(9), 'Holiday Office Party DJ', 'End-of-year office party.', 'open', 275_000, 'NGN', 'Abuja', false, 'office_party', '+40 days'),
];

function g(
    n: number,
    employer: string,
    title: string,
    description: string,
    status: GigStatus,
    budget: number,
    currency: string,
    city: string,
    isRemote: boolean,
    eventType: string,
    relativeDate: string,
): SeedGig {
    return {
        id: gigId(n),
        employerId: employer,
        title,
        description,
        status,
        budget,
        currency,
        city,
        isRemote,
        eventType,
        gigDate: resolveDate(relativeDate),
    };
}

function resolveDate(relative: string): string {
    const match = relative.match(/^([+-]\d+)\s+days$/);
    if (!match) return relative;
    const days = parseInt(match[1], 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

interface SeedApplication {
    id: string;
    gigId: string;
    talentId: string;
    status: ApplicationStatus;
    proposedRate: number;
    proposalMessage: string;
}

// Every application_status value is represented at least once. The hired-
// application on gig 3 is the pivot for the "completed gig, paid out" flow in
// payments.ts; the hired-application on gig 7 is the pivot for the "in
// escrow, disputed" / "in progress" flow.
const APPLICATIONS: SeedApplication[] = [
    // gig 1 (open) has multiple applicants
    a(1, gigId(1), talentId(1), 'shortlisted', 420_000, 'Happy to DJ this launch — I did V Towers last year.'),
    a(2, gigId(1), talentId(2), 'submitted', 450_000, 'Available and excited to pitch.'),
    a(3, gigId(1), talentId(15), 'rejected', 300_000, 'Rate may be below target.'),
    // gig 3 (completed) — hired -> pivot for paid/payout flow
    a(4, gigId(3), talentId(3), 'hired', 600_000, 'Portfolio attached, full-day shoot experience.'),
    a(5, gigId(3), talentId(15), 'rejected', 550_000, 'Looking for a discount.'),
    // gig 4 (disputed) — hired -> pivot for dispute
    a(6, gigId(4), talentId(14), 'hired', 250_000, 'Videographer with event highlight-reel samples.'),
    // gig 5 (open) — shortlist-heavy for reviewing flow
    a(7, gigId(5), talentId(2), 'shortlisted', 1_100_000, 'Two-day anchoring with conference experience.'),
    a(8, gigId(5), talentId(4), 'reviewing', 1_150_000, 'Fresh pitch with sample clips.'),
    // gig 7 (in_progress) — hired -> talent 4
    a(9, gigId(7), talentId(4), 'hired', 800_000, 'Lead dancer, full crew behind me.'),
    // gig 8 (open)
    a(10, gigId(8), talentId(1), 'submitted', 180_000, 'Open to full-day store launch.'),
    // gig 10 (cancelled)
    a(11, gigId(10), talentId(2), 'withdrawn', 90_000, 'Withdrawing, conflict on date.'),
    // gig 11 (expired)
    a(12, gigId(11), talentId(5), 'rejected', 900_000, 'Rate not matched.'),
    // gig 12 (open) — mid-checkout
    a(13, gigId(12), talentId(6), 'hired', 200_000, 'Senior mixologist, I can bring my own bar kit.'),
    // gig 13 (open) — countered-offer scenario feeds into offers
    a(14, gigId(13), talentId(3), 'submitted', 300_000, 'Love outdoor shoots.'),
    // gig 14 (NYE) — joy has many rejected applicants
    a(15, gigId(14), talentId(15), 'rejected', 400_000, 'Rejected — looking for local talent only.'),
    a(16, gigId(14), talentId(15), 'rejected', 420_000, 'Duplicate resubmission.'),
    a(17, gigId(14), talentId(15), 'rejected', 440_000, 'Third time rejected.'),
    a(18, gigId(14), talentId(15), 'rejected', 460_000, 'Fourth.'),
    a(19, gigId(14), talentId(15), 'rejected', 480_000, 'Fifth — exhausted this gig.'),
    // gig 16 (completed) — has a hired talent for review/history
    a(20, gigId(16), talentId(5), 'hired', 700_000, 'AV supervisor, I brought a crew of 3.'),
];

function a(n: number, gig: string, talent: string, status: ApplicationStatus, rate: number, message: string): SeedApplication {
    return { id: applicationId(n), gigId: gig, talentId: talent, status, proposedRate: rate, proposalMessage: message };
}

interface SeedOffer {
    id: string;
    gigId: string;
    employerId: string;
    talentId: string;
    status: OfferStatus;
    proposedRate: number;
    counterAmount: number | null;
    counterMessage: string | null;
    message: string | null;
}

const OFFERS: SeedOffer[] = [
    // pending, accepted, declined, withdrawn, expired, countered — every offer_status enum
    o(1, gigId(1), employerId(1), talentId(1), 'pending', 420_000, null, null, 'Want you on this one.'),
    o(2, gigId(3), employerId(2), talentId(3), 'accepted', 600_000, null, null, 'Offer accepted, see you Saturday.'),
    o(3, gigId(5), employerId(6), talentId(2), 'declined', 1_100_000, null, null, 'Declined — conflict in schedule.'),
    o(4, gigId(8), employerId(6), talentId(1), 'withdrawn', 180_000, null, null, 'Withdrew after a staffing change.'),
    o(5, gigId(11), employerId(7), talentId(5), 'expired', 900_000, null, null, 'Offer aged out.'),
    o(6, gigId(13), employerId(9), talentId(3), 'countered', 300_000, 320_000, 'Can we land at 320k?', 'Initial offer for the outdoor shoot.'),
    o(7, gigId(7), employerId(6), talentId(4), 'accepted', 800_000, null, null, 'Locked in the crew.'),
];

function o(
    n: number,
    gig: string,
    employer: string,
    talent: string,
    status: OfferStatus,
    rate: number,
    counterAmount: number | null,
    counterMessage: string | null,
    message: string | null,
): SeedOffer {
    return { id: offerId(n), gigId: gig, employerId: employer, talentId: talent, status, proposedRate: rate, counterAmount, counterMessage, message };
}

interface SeedSavedGig {
    id: string;
    userId: string;
    gigId: string;
}

const SAVED_GIGS: SeedSavedGig[] = [
    { id: savedGigId(1), userId: talentId(3), gigId: gigId(1) },
    { id: savedGigId(2), userId: talentId(3), gigId: gigId(5) },
    { id: savedGigId(3), userId: talentId(3), gigId: gigId(14) },
    { id: savedGigId(4), userId: talentId(1), gigId: gigId(5) },
    { id: savedGigId(5), userId: talentId(2), gigId: gigId(14) },
];

export async function seedGigs(): Promise<void> {
    log('gigs', `upserting ${GIGS.length} gigs / ${APPLICATIONS.length} applications / ${OFFERS.length} offers`);

    const gigRows = GIGS.map((gig) => ({
        id: gig.id,
        employer_id: gig.employerId,
        title: gig.title,
        description: gig.description,
        status: gig.status,
        budget_amount: gig.budget,
        currency: gig.currency,
        location_city: gig.city,
        location_name: gig.city,
        location_country: 'Nigeria',
        is_remote: gig.isRemote,
        event_type: gig.eventType,
        gig_date: gig.gigDate,
        required_talent_count: 1,
    }));
    await upsertIfAbsent('gigs', gigRows, 'id');

    const applicationRows = APPLICATIONS.map((app) => ({
        id: app.id,
        gig_id: app.gigId,
        talent_id: app.talentId,
        status: app.status,
        proposed_rate: app.proposedRate,
        proposed_currency: 'NGN',
        proposal_message: app.proposalMessage,
        hired_at: app.status === 'hired' ? new Date().toISOString() : null,
    }));
    await upsertIfAbsent('gig_applications', applicationRows, 'id');

    const offerRows = OFFERS.map((off) => ({
        id: off.id,
        gig_id: off.gigId,
        employer_id: off.employerId,
        talent_id: off.talentId,
        status: off.status,
        proposed_rate: off.proposedRate,
        currency: 'NGN',
        message: off.message,
        counter_amount: off.counterAmount,
        counter_message: off.counterMessage,
        accepted_at: off.status === 'accepted' ? new Date().toISOString() : null,
        declined_at: off.status === 'declined' ? new Date().toISOString() : null,
        expires_at: addDays(14),
        responded_at: off.status === 'pending' ? null : new Date().toISOString(),
    }));
    await upsertIfAbsent('gig_offers', offerRows, 'id');

    await upsertIfAbsent(
        'saved_gigs',
        SAVED_GIGS.map((s) => ({ id: s.id, user_id: s.userId, gig_id: s.gigId })),
        'id',
    );

    log('gigs', 'done');
}

function addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}
