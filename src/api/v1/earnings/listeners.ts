import { dispatch } from '@/app';
import { logger } from '@/core';
import { sendEmail } from '@/core/services/mails';
import {
    disputeOpenedMail,
    disputeResolvedMail,
    paymentReceivedMail,
    paymentReleasedMail,
    payoutPaidMail,
    payoutRequestedMail,
} from '@/core/services/mails/views';
import { resolveUserDisplayName } from '~/auth/utils/passwordRecovery';
import { GigRepository } from '~/gigs/repository';
import { User } from '~/user/interfaces';
import { DisputeRepository, EarningsRepository } from './repository';
import { Payment, PayoutRequest } from './interfaces';

export async function updatePayoutRequestStatusEventListener(input: { payoutRequestId: string; status: string }): Promise<PayoutRequest> {
    const earningsRepository = new EarningsRepository();
    const payoutRequest = await earningsRepository.updatePayoutRequest(input.payoutRequestId, {
        status: input.status as PayoutRequest['status'],
        processedAt: new Date().toISOString(),
    });
    return payoutRequest;
}

export async function createEarningsRecordEventListener(input: {
    employerId: string;
    talentId: string;
    gigId: string;
    amount: number;
}): Promise<Payment> {
    const earningsRepository = new EarningsRepository();
    const earning = await earningsRepository.createPayment({
        employerId: input.employerId,
        talentId: input.talentId,
        gigId: input.gigId,
        amount: input.amount,
        provider: 'manual',
    });
    return earning;
}

async function loadRecipient(userId: string): Promise<{ email: string; firstName: string } | null> {
    const [user] = await dispatch('user:get-by-id', { id: userId });
    if (!user?.email) return null;

    const displayName = resolveUserDisplayName(user.firstName ?? null, user.email);
    return { email: user.email, firstName: displayName };
}

function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function resolveGigTitle(gigId: string | null): Promise<string> {
    if (!gigId) return 'your gig';
    try {
        const gigRepository = new GigRepository();
        const gig = await gigRepository.getGigById(gigId);
        return gig?.title ?? 'your gig';
    } catch (error) {
        logger.warn('Failed to load gig title for email', { gigId, error: String(error) });
        return 'your gig';
    }
}

async function safeSend(to: string, subject: string, body: string): Promise<void> {
    try {
        await sendEmail({ to, subject, body });
    } catch (error) {
        logger.error('Failed to send payment / payout email', { to, subject, error: String(error) });
    }
}

export async function paymentHeldEventListener(input: {
    paymentId: string;
    employerId: string;
    talentId: string;
    gigId: string | null;
    amount: number;
    currency: string;
}): Promise<void> {
    const [recipient, gigTitle] = await Promise.all([loadRecipient(input.talentId), resolveGigTitle(input.gigId)]);
    if (!recipient) return;

    await safeSend(
        recipient.email,
        `Funds secured in escrow for ${gigTitle}`,
        paymentReceivedMail({
            firstName: recipient.firstName,
            gigTitle,
            amount: formatAmount(input.amount),
            currency: input.currency,
        }),
    );
}

export async function paymentReleasedEventListener(input: {
    paymentId: string;
    employerId: string;
    talentId: string;
    gigId: string | null;
    amount: number;
    currency: string;
}): Promise<void> {
    const [recipient, gigTitle] = await Promise.all([loadRecipient(input.talentId), resolveGigTitle(input.gigId)]);
    if (!recipient) return;

    await safeSend(
        recipient.email,
        `${input.currency} ${formatAmount(input.amount)} released`,
        paymentReleasedMail({
            firstName: recipient.firstName,
            gigTitle,
            amount: formatAmount(input.amount),
            currency: input.currency,
        }),
    );
}

export async function payoutRequestedEventListener(input: {
    payoutRequestId: string;
    talentId: string;
    amount: number;
    currency: string;
}): Promise<void> {
    const recipient = await loadRecipient(input.talentId);
    if (!recipient) return;

    await safeSend(
        recipient.email,
        'Payout request received',
        payoutRequestedMail({
            firstName: recipient.firstName,
            amount: formatAmount(input.amount),
            currency: input.currency,
        }),
    );
}

export async function payoutPaidEventListener(input: {
    payoutRequestId: string;
    talentId: string;
    amount: number;
    currency: string;
    externalTransferId: string | null;
    externalProvider: string | null;
}): Promise<void> {
    const recipient = await loadRecipient(input.talentId);
    if (!recipient) return;

    await safeSend(
        recipient.email,
        `Payout of ${input.currency} ${formatAmount(input.amount)} sent`,
        payoutPaidMail({
            firstName: recipient.firstName,
            amount: formatAmount(input.amount),
            currency: input.currency,
            externalTransferId: input.externalTransferId ?? 'pending',
            externalProvider: input.externalProvider ?? 'manual',
        }),
    );
}

async function loadDisputePartiesAndGig(
    paymentId: string | null,
    gigId: string | null,
): Promise<{
    talent: Awaited<ReturnType<typeof loadRecipient>>;
    employer: Awaited<ReturnType<typeof loadRecipient>>;
    gigTitle: string;
}> {
    let talentId: string | null = null;
    let employerId: string | null = null;

    if (paymentId) {
        try {
            const earningsRepository = new EarningsRepository();
            const payment = await earningsRepository.getPaymentById(paymentId);
            if (payment) {
                talentId = payment.talentId;
                employerId = payment.employerId;
            }
        } catch (error) {
            logger.warn('Failed to load payment for dispute email', { paymentId, error: String(error) });
        }
    }

    const [talent, employer, gigTitle] = await Promise.all([
        talentId ? loadRecipient(talentId) : Promise.resolve(null),
        employerId ? loadRecipient(employerId) : Promise.resolve(null),
        resolveGigTitle(gigId),
    ]);

    return { talent, employer, gigTitle };
}

export async function disputeOpenedEventListener(input: {
    disputeId: string;
    paymentId: string | null;
    gigId: string | null;
    raisedBy: string | null;
}): Promise<void> {
    logger.info('Dispute opened', input);

    const disputeRepository = new DisputeRepository();
    const dispute = await disputeRepository.getById(input.disputeId);
    if (!dispute) return;

    const { talent, employer, gigTitle } = await loadDisputePartiesAndGig(input.paymentId, input.gigId);

    const sends: Promise<void>[] = [];
    const reason = dispute.reason;
    const mailFor = (firstName: string) =>
        disputeOpenedMail({
            firstName,
            gigTitle,
            reason,
        });

    if (talent) sends.push(safeSend(talent.email, `Dispute opened on ${gigTitle}`, mailFor(talent.firstName)));
    if (employer) sends.push(safeSend(employer.email, `Dispute opened on ${gigTitle}`, mailFor(employer.firstName)));

    await Promise.all(sends);
}

export async function disputeResolvedEventListener(input: {
    disputeId: string;
    paymentId: string | null;
    gigId: string | null;
    resolution: 'resolved_talent' | 'resolved_employer' | 'withdrawn';
    resolvedBy: string | null;
}): Promise<void> {
    logger.info('Dispute resolved', input);

    const { talent, employer, gigTitle } = await loadDisputePartiesAndGig(input.paymentId, input.gigId);

    const mailFor = (firstName: string) =>
        disputeResolvedMail({
            firstName,
            gigTitle,
            resolution: input.resolution,
        });

    const sends: Promise<void>[] = [];
    if (talent) sends.push(safeSend(talent.email, `Dispute on ${gigTitle} resolved`, mailFor(talent.firstName)));
    if (employer) sends.push(safeSend(employer.email, `Dispute on ${gigTitle} resolved`, mailFor(employer.firstName)));

    await Promise.all(sends);
}

// Keep a type reference so the file's User import is never shaken out by
// a future reorganization; listeners above call dispatch('user:get-by-id')
// which returns Partial<User>.
export type __EarningsListenerUserRef = Partial<User>;
