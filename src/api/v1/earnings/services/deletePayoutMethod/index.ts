import { BadRequestError, ConflictError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EarningsRepository, PayoutMethodRepository } from '~/earnings/repository';

type DeletePayoutMethodArgs = ControllerArgs<{
    params: { id: string };
}>;

export class DeletePayoutMethod {
    constructor(private readonly payoutMethodRepository: PayoutMethodRepository, private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ params, request }: DeletePayoutMethodArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Payout method ID is required');

        const method = await this.payoutMethodRepository.getById(params.id);
        if (!method) throw new RouteNotFoundError('Payout method not found');
        if (method.userId !== userId) throw new ForbiddenError('You cannot delete a payout method that is not yours');

        // Only block delete if this is the user's ONLY verified method AND
        // they have pending payouts that would lose their destination. Any
        // other payout method can be deleted freely.
        if (method.isVerified) {
            const allMethods = await this.payoutMethodRepository.listForUser(userId);
            const otherVerified = allMethods.some((m) => m.id !== method.id && m.isVerified);

            if (!otherVerified) {
                const pendingPayouts = await this.earningsRepository.getPayoutRequestsForTalent(userId);
                const hasPending = pendingPayouts.some((p) => p.status === 'requested' || p.status === 'approved');
                if (hasPending) {
                    throw new ConflictError('Cannot delete the only verified payout method while payout requests are still pending');
                }
            }
        }

        await this.payoutMethodRepository.deleteById(method.id);

        return {
            code: HttpStatus.OK,
            message: 'Payout Method Deleted Successfully',
            data: { id: method.id },
        };
    };
}

const deletePayoutMethod = new DeletePayoutMethod(new PayoutMethodRepository(), new EarningsRepository());

export default deletePayoutMethod;
