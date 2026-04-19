import { adminId, applicationId, disputeEvidenceId, disputeId, employerId, gigId, paymentId, payoutMethodId, payoutRequestId, talentId } from './ids';
import { log, upsertIfAbsent } from './helpers';

type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
type PaymentProvider = 'manual' | 'paystack' | 'flutterwave' | 'stripe';
type PayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected';
type DisputeStatus = 'open' | 'in_review' | 'resolved_talent' | 'resolved_employer' | 'withdrawn';

interface SeedPayment {
    id: string;
    gigId: string | null;
    applicationId: string | null;
    employerId: string;
    talentId: string;
    amount: number;
    status: PaymentStatus;
    provider: PaymentProvider;
    paymentReference: string | null;
    paidAt: string | null;
}

// Payments are anchored to hired applications where possible so the
// earnings / dispute / payout flows downstream look coherent. Every
// payment_status is represented at least once, and both manual and stripe
// providers are seeded so webhook-adjacent paths can be exercised.
const PAYMENTS: SeedPayment[] = [
    p(1, gigId(3), applicationId(4), employerId(2), talentId(3), 600_000, 'paid', 'stripe', 'pi_seed_paid_3', true),
    p(2, gigId(7), applicationId(9), employerId(6), talentId(4), 800_000, 'processing', 'stripe', 'pi_seed_processing_7', false),
    p(3, gigId(12), applicationId(13), employerId(8), talentId(6), 200_000, 'pending', 'stripe', 'pi_seed_pending_12', false),
    p(4, gigId(4), applicationId(6), employerId(3), talentId(14), 250_000, 'paid', 'manual', 'ref_seed_manual_4', true),
    p(5, gigId(16), applicationId(20), employerId(2), talentId(5), 700_000, 'paid', 'manual', 'ref_seed_manual_16', true),
    p(6, null, null, employerId(9), talentId(3), 50_000, 'failed', 'stripe', 'pi_seed_failed_demo', false),
    p(7, null, null, employerId(1), talentId(7), 120_000, 'refunded', 'manual', 'ref_seed_refunded', true),
    p(8, null, null, employerId(6), talentId(20), 180_000, 'cancelled', 'manual', 'ref_seed_cancelled', false),
    // a paid payment for talent 20 so they have earnings backing a payout request
    p(9, null, null, employerId(6), talentId(20), 450_000, 'paid', 'stripe', 'pi_seed_talent20_paid', true),
    // a paid payment for talent 7 so they have available earnings
    p(10, null, null, employerId(1), talentId(7), 320_000, 'paid', 'stripe', 'pi_seed_talent7_paid', true),
    // a paid payment for talent 8 (payout paid scenario)
    p(11, null, null, employerId(1), talentId(8), 300_000, 'paid', 'manual', 'ref_seed_talent8_paid', true),
    // a paid payment for talent 9 (payout rejected scenario)
    p(12, null, null, employerId(2), talentId(9), 150_000, 'paid', 'manual', 'ref_seed_talent9_paid', true),
];

function p(
    n: number,
    gig: string | null,
    application: string | null,
    employer: string,
    talent: string,
    amount: number,
    status: PaymentStatus,
    provider: PaymentProvider,
    reference: string | null,
    paid: boolean,
): SeedPayment {
    return {
        id: paymentId(n),
        gigId: gig,
        applicationId: application,
        employerId: employer,
        talentId: talent,
        amount,
        status,
        provider,
        paymentReference: reference,
        paidAt: paid ? new Date().toISOString() : null,
    };
}

interface SeedPayoutMethod {
    id: string;
    userId: string;
    provider: string;
    displayLabel: string;
    externalAccountId: string;
    isDefault: boolean;
    isVerified: boolean;
}

const PAYOUT_METHODS: SeedPayoutMethod[] = [
    {
        id: payoutMethodId(1),
        userId: talentId(20),
        provider: 'bank_wire',
        displayLabel: 'GTBank •••• 0101',
        externalAccountId: 'acct_gtbank_0101',
        isDefault: true,
        isVerified: true,
    },
    {
        id: payoutMethodId(2),
        userId: talentId(20),
        provider: 'stripe',
        displayLabel: 'Stripe account',
        externalAccountId: 'acct_stripe_seed',
        isDefault: false,
        isVerified: true,
    },
    {
        id: payoutMethodId(3),
        userId: talentId(7),
        provider: 'bank_wire',
        displayLabel: 'Zenith •••• 2202',
        externalAccountId: 'acct_zenith_2202',
        isDefault: true,
        isVerified: false,
    },
    {
        id: payoutMethodId(4),
        userId: talentId(8),
        provider: 'bank_wire',
        displayLabel: 'UBA •••• 3303',
        externalAccountId: 'acct_uba_3303',
        isDefault: true,
        isVerified: true,
    },
];

interface SeedPayoutRequest {
    id: string;
    talentId: string;
    amount: number;
    status: PayoutStatus;
    note: string | null;
    externalTransferId: string | null;
    externalProvider: string | null;
    paidAt: string | null;
    paidBy: string | null;
}

// Every `payout_status` enum is seeded. The `paid` row exercises the
// external-ref fields added in migration 20260426.
const PAYOUT_REQUESTS: SeedPayoutRequest[] = [
    {
        id: payoutRequestId(1),
        talentId: talentId(7),
        amount: 250_000,
        status: 'requested',
        note: 'Weekly withdrawal',
        externalTransferId: null,
        externalProvider: null,
        paidAt: null,
        paidBy: null,
    },
    {
        id: payoutRequestId(2),
        talentId: talentId(20),
        amount: 300_000,
        status: 'approved',
        note: 'End-of-month',
        externalTransferId: null,
        externalProvider: null,
        paidAt: null,
        paidBy: adminId(1),
    },
    {
        id: payoutRequestId(3),
        talentId: talentId(8),
        amount: 280_000,
        status: 'paid',
        note: 'Paid out via Stripe',
        externalTransferId: 'tr_seed_stripe_talent8',
        externalProvider: 'stripe',
        paidAt: new Date().toISOString(),
        paidBy: adminId(1),
    },
    {
        id: payoutRequestId(4),
        talentId: talentId(9),
        amount: 100_000,
        status: 'rejected',
        note: 'Missing KYC docs',
        externalTransferId: null,
        externalProvider: null,
        paidAt: null,
        paidBy: adminId(2),
    },
    {
        id: payoutRequestId(5),
        talentId: talentId(20),
        amount: 150_000,
        status: 'paid',
        note: 'Paid via bank wire',
        externalTransferId: 'wire_seed_talent20',
        externalProvider: 'bank_wire',
        paidAt: new Date().toISOString(),
        paidBy: adminId(1),
    },
];

interface SeedDispute {
    id: string;
    paymentId: string;
    gigId: string;
    raisedBy: string;
    reason: string;
    description: string;
    status: DisputeStatus;
    resolvedBy: string | null;
    resolvedAt: string | null;
}

const DISPUTES: SeedDispute[] = [
    {
        id: disputeId(1),
        paymentId: paymentId(4),
        gigId: gigId(4),
        raisedBy: talentId(14),
        reason: 'work_not_delivered',
        description: 'Delivered raw files but employer refuses to release escrow.',
        status: 'open',
        resolvedBy: null,
        resolvedAt: null,
    },
    {
        id: disputeId(2),
        paymentId: paymentId(5),
        gigId: gigId(16),
        raisedBy: employerId(2),
        reason: 'quality_below_expectations',
        description: 'Audio levels were off throughout day two.',
        status: 'in_review',
        resolvedBy: adminId(1),
        resolvedAt: null,
    },
    {
        id: disputeId(3),
        paymentId: paymentId(1),
        gigId: gigId(3),
        raisedBy: talentId(3),
        reason: 'unpaid_bonus',
        description: 'Overtime bonus never released.',
        status: 'resolved_talent',
        resolvedBy: adminId(1),
        resolvedAt: new Date().toISOString(),
    },
    {
        id: disputeId(4),
        paymentId: paymentId(2),
        gigId: gigId(7),
        raisedBy: employerId(6),
        reason: 'no_show',
        description: 'Crew missed call time.',
        status: 'resolved_employer',
        resolvedBy: adminId(2),
        resolvedAt: new Date().toISOString(),
    },
    {
        id: disputeId(5),
        paymentId: paymentId(7),
        gigId: gigId(1),
        raisedBy: talentId(7),
        reason: 'refund_preference',
        description: 'Agreed to withdraw in favor of reissued gig.',
        status: 'withdrawn',
        resolvedBy: null,
        resolvedAt: new Date().toISOString(),
    },
];

interface SeedDisputeEvidence {
    id: string;
    disputeId: string;
    uploadedBy: string;
    evidenceType: 'screenshot' | 'message' | 'document' | 'other';
    fileUrl: string;
    notes: string;
}

const DISPUTE_EVIDENCE: SeedDisputeEvidence[] = [
    {
        id: disputeEvidenceId(1),
        disputeId: disputeId(1),
        uploadedBy: talentId(14),
        evidenceType: 'screenshot',
        fileUrl: 'https://seed.example.com/dispute-1-chat.png',
        notes: 'Chat transcript where delivery was confirmed.',
    },
    {
        id: disputeEvidenceId(2),
        disputeId: disputeId(1),
        uploadedBy: talentId(14),
        evidenceType: 'document',
        fileUrl: 'https://seed.example.com/dispute-1-invoice.pdf',
        notes: 'Signed invoice.',
    },
    {
        id: disputeEvidenceId(3),
        disputeId: disputeId(2),
        uploadedBy: employerId(2),
        evidenceType: 'other',
        fileUrl: 'https://seed.example.com/dispute-2-audio.wav',
        notes: 'Raw audio sample showing clipping.',
    },
];

export async function seedPayments(): Promise<void> {
    log(
        'payments',
        `upserting ${PAYMENTS.length} payments / ${PAYOUT_METHODS.length} payout methods / ${PAYOUT_REQUESTS.length} payout requests / ${DISPUTES.length} disputes`,
    );

    const paymentRows = PAYMENTS.map((pay) => ({
        id: pay.id,
        gig_id: pay.gigId,
        application_id: pay.applicationId,
        employer_id: pay.employerId,
        talent_id: pay.talentId,
        amount: pay.amount,
        currency: 'NGN',
        platform_fee: Math.round(pay.amount * 0.1),
        provider: pay.provider,
        payment_reference: pay.paymentReference,
        status: pay.status,
        metadata: { seed: true },
        paid_at: pay.paidAt,
    }));
    await upsertIfAbsent('payments', paymentRows, 'id');

    const payoutMethodRows = PAYOUT_METHODS.map((m) => ({
        id: m.id,
        user_id: m.userId,
        provider: m.provider,
        display_label: m.displayLabel,
        external_account_id: m.externalAccountId,
        is_default: m.isDefault,
        is_verified: m.isVerified,
        metadata: { seed: true },
    }));
    await upsertIfAbsent('payout_methods', payoutMethodRows, 'id');

    const payoutRows = PAYOUT_REQUESTS.map((r) => ({
        id: r.id,
        talent_id: r.talentId,
        amount: r.amount,
        currency: 'NGN',
        note: r.note,
        status: r.status,
        external_transfer_id: r.externalTransferId,
        external_provider: r.externalProvider,
        paid_at: r.paidAt,
        paid_by: r.paidBy,
    }));
    await upsertIfAbsent('payout_requests', payoutRows, 'id');

    const disputeRows = DISPUTES.map((d) => ({
        id: d.id,
        payment_id: d.paymentId,
        gig_id: d.gigId,
        raised_by: d.raisedBy,
        reason: d.reason,
        description: d.description,
        status: d.status,
        resolved_by: d.resolvedBy,
        resolved_at: d.resolvedAt,
    }));
    await upsertIfAbsent('disputes', disputeRows, 'id');

    const evidenceRows = DISPUTE_EVIDENCE.map((e) => ({
        id: e.id,
        dispute_id: e.disputeId,
        uploaded_by: e.uploadedBy,
        evidence_type: e.evidenceType,
        file_url: e.fileUrl,
        notes: e.notes,
    }));
    await upsertIfAbsent('dispute_evidence', evidenceRows, 'id');

    log('payments', 'done');
}
