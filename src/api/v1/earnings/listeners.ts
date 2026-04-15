import { Payment, PayoutRequest } from './interfaces';
import { EarningsRepository } from './repository';

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
