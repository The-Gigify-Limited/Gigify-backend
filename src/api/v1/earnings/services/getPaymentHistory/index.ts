import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { PaymentHistoryQueryDto } from '~/earnings/interfaces';
import { EarningsRepository } from '~/earnings/repository';

export class GetPaymentHistory {
    constructor(private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ query, request }: ControllerArgs<PaymentHistoryQueryDto>) => {
        const talentId = request.user?.id;

        if (!talentId) throw new UnAuthorizedError('User not authenticated');

        const payments = await this.earningsRepository.getPaymentHistoryForTalent(talentId, query);

        return {
            code: HttpStatus.OK,
            message: 'Payment History Retrieved Successfully',
            data: payments,
        };
    };
}

const getPaymentHistory = new GetPaymentHistory(new EarningsRepository());

export default getPaymentHistory;
