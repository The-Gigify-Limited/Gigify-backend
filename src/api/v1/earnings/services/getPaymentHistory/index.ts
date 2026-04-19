import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { Payment, PaymentHistoryQueryDto } from '~/earnings/interfaces';
import { DisputeRepository, EarningsRepository } from '~/earnings/repository';

export class GetPaymentHistory {
    constructor(private readonly earningsRepository: EarningsRepository, private readonly disputeRepository: DisputeRepository) {}

    handle = async ({ query, request }: ControllerArgs<PaymentHistoryQueryDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const rawStatus = query?.status;
        let paymentIdsFilter: string[] | undefined;
        let persistedStatus: Payment['status'] | undefined;

        if (rawStatus === 'released') {
            // Frontend vocabulary: 'released' === paid-out / escrow released.
            // Internally that is payment_status = 'paid'.
            persistedStatus = 'paid';
        } else if (rawStatus === 'disputed') {
            // 'disputed' is not a payment_status; it's a cross-table concept
            // (any payment whose dispute row is open or in_review). Resolve to
            // an id set and pass it through as paymentIdsFilter.
            paymentIdsFilter = await this.disputeRepository.findPaymentIdsWithOpenDispute();
        } else if (rawStatus) {
            persistedStatus = rawStatus;
        }

        const payments = await this.earningsRepository.getPaymentHistoryForUser(userId, {
            page: query?.page,
            pageSize: query?.pageSize,
            dateFrom: query?.dateFrom,
            dateTo: query?.dateTo,
            status: persistedStatus,
            direction: query?.direction,
            gigId: query?.gigId,
            paymentIdsFilter,
        });

        return {
            code: HttpStatus.OK,
            message: 'Payment History Retrieved Successfully',
            data: payments,
        };
    };
}

const getPaymentHistory = new GetPaymentHistory(new EarningsRepository(), new DisputeRepository());

export default getPaymentHistory;
