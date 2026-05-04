import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { DisputeRepository } from '~/earnings/repository';
import { DisputeStatusEnum } from '~/earnings/interfaces';

type ListDisputesArgs = ControllerArgs<{
    query: { page?: number; pageSize?: number; status?: DisputeStatusEnum };
}>;

export class ListDisputes {
    constructor(private readonly disputeRepository: DisputeRepository) {}

    handle = async ({ query, request }: ListDisputesArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const disputes = await this.disputeRepository.findForUser(userId, {
            pagination: { page: query?.page, pageSize: query?.pageSize },
            status: query?.status,
        });

        return {
            code: HttpStatus.OK,
            message: 'Disputes Retrieved Successfully',
            data: disputes,
        };
    };
}

const listDisputes = new ListDisputes(new DisputeRepository());

export default listDisputes;
