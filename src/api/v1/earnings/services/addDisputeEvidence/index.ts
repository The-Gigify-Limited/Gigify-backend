import { BadRequestError, ConflictError, ControllerArgs, ForbiddenError, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { DisputeRepository, EarningsRepository } from '~/earnings/repository';
import { DisputeEvidenceTypeEnum } from '~/earnings/interfaces';

type AddDisputeEvidenceArgs = ControllerArgs<{
    params: { id: string };
    input: { evidenceType: DisputeEvidenceTypeEnum; fileUrl: string; notes?: string };
}>;

export class AddDisputeEvidence {
    constructor(private readonly disputeRepository: DisputeRepository, private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ params, input, request }: AddDisputeEvidenceArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Dispute ID is required');

        const dispute = await this.disputeRepository.getById(params.id);
        if (!dispute) throw new RouteNotFoundError('Dispute not found');

        const terminalStates = new Set(['resolved_talent', 'resolved_employer', 'withdrawn']);
        if (terminalStates.has(dispute.status)) {
            throw new ConflictError('Cannot add evidence to a resolved dispute');
        }

        const isParty = await this.isParty(userId, dispute);
        if (!isParty) {
            throw new ForbiddenError('Only parties to this dispute can add evidence');
        }

        const evidence = await this.disputeRepository.addEvidence({
            disputeId: dispute.id,
            uploadedBy: userId,
            evidenceType: input.evidenceType,
            fileUrl: input.fileUrl,
            notes: input.notes ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Dispute Evidence Added Successfully',
            data: evidence,
        };
    };

    private async isParty(userId: string, dispute: { raisedBy: string | null; paymentId: string | null }): Promise<boolean> {
        if (dispute.raisedBy === userId) return true;
        if (!dispute.paymentId) return false;

        const payment = await this.earningsRepository.getPaymentById(dispute.paymentId);
        if (!payment) return false;
        return payment.employerId === userId || payment.talentId === userId;
    }
}

const addDisputeEvidence = new AddDisputeEvidence(new DisputeRepository(), new EarningsRepository());

export default addDisputeEvidence;
