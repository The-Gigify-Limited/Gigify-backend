// Stable UUIDs for every seeded persona/entity. Using fixed IDs lets the
// script be idempotent (skip-if-exists keys off the PK) and makes FK wiring
// between tables trivial — no email lookups, no caches.
//
// Prefix convention (first octet picks the domain):
//   1000… employer, 2000… talent, 3000… admin,
//   4000… gig, 5000… gig_application, 6000… gig_offer,
//   7000… payment, a000… payout_request, b000… payout_method,
//   c000… dispute, c100… dispute_evidence,
//   8000… conversation, 8100… message, 8200… message_report,
//   9000… notification,
//   d000… talent_review, d100… talent_portfolio,
//   e000… gig_report,
//   f000… identity_verification, f100… saved_gig

const pad = (prefix: string, n: number) => {
    const id = n.toString().padStart(12, '0');
    return `${prefix}-0000-0000-0000-${id}`;
};

export const employerId = (n: number) => pad('10000000', n);
export const talentId = (n: number) => pad('20000000', n);
export const adminId = (n: number) => pad('30000000', n);
export const gigId = (n: number) => pad('40000000', n);
export const applicationId = (n: number) => pad('50000000', n);
export const offerId = (n: number) => pad('60000000', n);
export const paymentId = (n: number) => pad('70000000', n);
export const conversationId = (n: number) => pad('80000000', n);
export const messageId = (n: number) => pad('81000000', n);
export const messageReportId = (n: number) => pad('82000000', n);
export const notificationId = (n: number) => pad('90000000', n);
export const payoutRequestId = (n: number) => pad('a0000000', n);
export const payoutMethodId = (n: number) => pad('b0000000', n);
export const disputeId = (n: number) => pad('c0000000', n);
export const disputeEvidenceId = (n: number) => pad('c1000000', n);
export const reviewId = (n: number) => pad('d0000000', n);
export const portfolioId = (n: number) => pad('d1000000', n);
export const gigReportId = (n: number) => pad('e0000000', n);
export const identityId = (n: number) => pad('f0000000', n);
export const savedGigId = (n: number) => pad('f1000000', n);
