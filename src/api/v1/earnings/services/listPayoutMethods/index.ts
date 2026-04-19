import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { PayoutMethodRepository } from '~/earnings/repository';

export class ListPayoutMethods {
    constructor(private readonly payoutMethodRepository: PayoutMethodRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const methods = await this.payoutMethodRepository.listForUser(userId);

        return {
            code: HttpStatus.OK,
            message: 'Payout Methods Retrieved Successfully',
            data: methods,
        };
    };
}

const listPayoutMethods = new ListPayoutMethods(new PayoutMethodRepository());

export default listPayoutMethods;
