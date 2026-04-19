import { BadRequestError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { PayoutMethodRepository } from '~/earnings/repository';

type SetDefaultArgs = ControllerArgs<{
    params: { id: string };
}>;

export class SetDefaultPayoutMethod {
    constructor(private readonly payoutMethodRepository: PayoutMethodRepository) {}

    handle = async ({ params, request }: SetDefaultArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Payout method ID is required');

        const method = await this.payoutMethodRepository.getById(params.id);
        if (!method) throw new RouteNotFoundError('Payout method not found');
        if (method.userId !== userId) throw new ForbiddenError('You cannot modify a payout method that is not yours');

        // The partial unique index `one_default_per_user` would reject an
        // INSERT/UPDATE that tried to flip two rows to default at once, so
        // clear the current default first, then promote the new one. A true
        // DB transaction is not available from the Supabase JS client;
        // failure between these two statements leaves the user with zero
        // defaults, which is reconcilable by re-running this endpoint.
        await this.payoutMethodRepository.clearDefaultsForUser(userId, params.id);
        const updated = await this.payoutMethodRepository.markDefault(params.id);

        return {
            code: HttpStatus.OK,
            message: 'Default Payout Method Updated Successfully',
            data: updated,
        };
    };
}

const setDefaultPayoutMethod = new SetDefaultPayoutMethod(new PayoutMethodRepository());

export default setDefaultPayoutMethod;
