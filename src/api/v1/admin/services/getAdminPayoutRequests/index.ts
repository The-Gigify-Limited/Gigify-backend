import { ControllerArgs, HttpStatus } from '@/core';
import { EarningsRepository } from '~/earnings/repository';
import { AdminPayoutRequestsQueryDto } from '../../interfaces';

export class GetAdminPayoutRequests {
    constructor(private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ query }: ControllerArgs<AdminPayoutRequestsQueryDto>) => {
        const payoutRequests = await this.earningsRepository.getPayoutRequests(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Payout Requests Retrieved Successfully',
            data: payoutRequests,
        };
    };
}

const getAdminPayoutRequests = new GetAdminPayoutRequests(new EarningsRepository());
export default getAdminPayoutRequests;
