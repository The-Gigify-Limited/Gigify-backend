import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { RequestPayoutDto } from '~/earnings/interfaces';
import { EarningsRepository } from '~/earnings/repository';
import { ActivityRepository } from '~/user/repository';

export class RequestPayout {
    constructor(private readonly earningsRepository: EarningsRepository, private readonly activityRepository: ActivityRepository) {}

    handle = async ({ input, request }: ControllerArgs<RequestPayoutDto>) => {
        const talentId = request.user?.id;

        if (!talentId) throw new UnAuthorizedError('User not authenticated');
        if (!input?.amount || input.amount <= 0) throw new BadRequestError('Payout amount must be greater than zero');

        const summary = await this.earningsRepository.getEarningsSummary(talentId);

        if (input.amount > summary.availableForPayout) {
            throw new ConflictError('Requested payout exceeds available balance');
        }

        const payoutRequest = await this.earningsRepository.createPayoutRequest(talentId, input);

        await this.activityRepository.logActivity(talentId, 'payout_requested', payoutRequest.id, {
            amount: payoutRequest.amount,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Payout Request Submitted Successfully',
            data: payoutRequest,
        };
    };
}

const requestPayout = new RequestPayout(new EarningsRepository(), new ActivityRepository());

export default requestPayout;
