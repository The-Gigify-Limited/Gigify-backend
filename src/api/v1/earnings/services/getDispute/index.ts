import { BadRequestError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { DisputeRepository, EarningsRepository } from '~/earnings/repository';

type GetDisputeArgs = ControllerArgs<{
    params: { id: string };
}>;

export class GetDispute {
    constructor(private readonly disputeRepository: DisputeRepository, private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ params, request }: GetDisputeArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Dispute ID is required');

        const dispute = await this.disputeRepository.getById(params.id);
        if (!dispute) throw new RouteNotFoundError('Dispute not found');

        const isParty = await this.isPartyToDispute(userId, dispute);
        if (!isParty && request.user?.role !== 'admin') {
            throw new ForbiddenError('You cannot view this dispute');
        }

        const evidence = await this.disputeRepository.listEvidenceForDispute(dispute.id);

        return {
            code: HttpStatus.OK,
            message: 'Dispute Retrieved Successfully',
            data: { ...dispute, evidence },
        };
    };

    private async isPartyToDispute(userId: string, dispute: { raisedBy: string | null; paymentId: string | null }): Promise<boolean> {
        if (dispute.raisedBy === userId) return true;
        if (!dispute.paymentId) return false;

        const payment = await this.earningsRepository.getPaymentById(dispute.paymentId);
        if (!payment) return false;
        return payment.employerId === userId || payment.talentId === userId;
    }
}

const getDispute = new GetDispute(new DisputeRepository(), new EarningsRepository());

export default getDispute;
