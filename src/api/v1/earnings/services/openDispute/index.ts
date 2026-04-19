import { dispatch } from '@/app';
import { BadRequestError, ConflictError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { GigRepository } from '~/gigs/repository';
import { DisputeRepository, EarningsRepository } from '~/earnings/repository';

type OpenDisputeArgs = ControllerArgs<{
    params: { id: string };
    input: { reason: string; description?: string };
}>;

export class OpenDispute {
    constructor(
        private readonly disputeRepository: DisputeRepository,
        private readonly earningsRepository: EarningsRepository,
        private readonly gigRepository: GigRepository,
    ) {}

    handle = async ({ params, input, request }: OpenDisputeArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Payment ID is required');

        const payment = await this.earningsRepository.getPaymentById(params.id);
        if (!payment) throw new RouteNotFoundError('Payment not found');

        if (userId !== payment.employerId && userId !== payment.talentId) {
            throw new ForbiddenError('Only parties to this payment can open a dispute');
        }

        if (payment.status !== 'pending' && payment.status !== 'processing' && payment.status !== 'paid') {
            throw new ConflictError(`Cannot dispute a payment with status ${payment.status}`);
        }

        const dispute = await this.disputeRepository.createDispute({
            paymentId: payment.id,
            gigId: payment.gigId,
            raisedBy: userId,
            reason: input.reason,
            description: input.description ?? null,
            status: 'open',
        });

        if (payment.gigId) {
            await this.gigRepository.updateGigById(payment.gigId, { status: 'disputed' as never });
        }

        await dispatch('earnings:dispute-opened', {
            disputeId: dispute.id,
            paymentId: payment.id,
            gigId: payment.gigId,
            raisedBy: userId,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Dispute Opened Successfully',
            data: dispute,
        };
    };
}

const openDispute = new OpenDispute(new DisputeRepository(), new EarningsRepository(), new GigRepository());

export default openDispute;
