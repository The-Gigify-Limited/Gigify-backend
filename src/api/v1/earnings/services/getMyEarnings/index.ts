import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { EarningsRepository } from '~/earnings/repository';

export class GetMyEarnings {
    constructor(private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const talentId = request.user?.id;

        if (!talentId) throw new UnAuthorizedError('User not authenticated');

        const summary = await this.earningsRepository.getEarningsSummary(talentId);

        return {
            code: HttpStatus.OK,
            message: 'Earnings Retrieved Successfully',
            data: summary,
        };
    };
}

const getMyEarnings = new GetMyEarnings(new EarningsRepository());

export default getMyEarnings;
