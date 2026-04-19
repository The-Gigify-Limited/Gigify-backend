import { ControllerArgs, HttpStatus } from '@/core';
import { DisputeRepository } from '~/earnings/repository';
import { DisputeStatusEnum } from '~/earnings/interfaces';

type ListAdminDisputesArgs = ControllerArgs<{
    query: { page?: number; pageSize?: number; status?: DisputeStatusEnum };
}>;

export class ListAdminDisputes {
    constructor(private readonly disputeRepository: DisputeRepository) {}

    handle = async ({ query }: ListAdminDisputesArgs) => {
        const disputes = await this.disputeRepository.listAll({
            pagination: { page: query?.page, pageSize: query?.pageSize },
            status: query?.status,
        });

        return {
            code: HttpStatus.OK,
            message: 'Admin Disputes Retrieved Successfully',
            data: disputes,
        };
    };
}

const listAdminDisputes = new ListAdminDisputes(new DisputeRepository());

export default listAdminDisputes;
