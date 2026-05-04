import { dispatch } from '@/app';
import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, logger } from '@/core';
import { DisputeRepository, EarningsRepository } from '~/earnings/repository';
import { DisputeStatusEnum } from '~/earnings/interfaces';
import { GigRepository } from '~/gigs/repository';

type ResolutionEnum = Extract<DisputeStatusEnum, 'resolved_talent' | 'resolved_employer' | 'withdrawn'>;

type ResolveDisputeArgs = ControllerArgs<{
    params: { id: string };
    input: { resolution: ResolutionEnum; adminNotes?: string };
}>;

export class ResolveDispute {
    constructor(
        private readonly disputeRepository: DisputeRepository,
        private readonly earningsRepository: EarningsRepository,
        private readonly gigRepository: GigRepository,
    ) {}

    handle = async ({ params, input, request }: ResolveDisputeArgs) => {
        const adminId = request.user?.id;
        if (!adminId) throw new UnAuthorizedError('User not authenticated');
        if (!params?.id) throw new BadRequestError('Dispute ID is required');

        const dispute = await this.disputeRepository.getById(params.id);
        if (!dispute) throw new RouteNotFoundError('Dispute not found');

        const terminalStates = new Set(['resolved_talent', 'resolved_employer', 'withdrawn']);
        if (terminalStates.has(dispute.status)) {
            throw new ConflictError('Dispute has already been resolved');
        }

        const updated = await this.disputeRepository.updateDispute(dispute.id, {
            status: input.resolution,
            adminNotes: input.adminNotes ?? null,
            resolvedAt: new Date().toISOString(),
            resolvedBy: adminId,
        });

        // Recover gig status depending on resolution. resolved_employer implies
        // the gig never happened / should be refunded; resolved_talent implies
        // the work is done. 'withdrawn' reverts to in_progress so the parties
        // can pick the flow back up. The actual money movement (Stripe refund
        // or escrow release) is handled by a follow-up PR; this just sets the
        // gig status and dispatches the event so downstream subscribers can
        // react.
        if (dispute.gigId) {
            const nextGigStatus =
                input.resolution === 'resolved_employer' ? 'cancelled' : input.resolution === 'resolved_talent' ? 'completed' : 'in_progress';
            try {
                await this.gigRepository.updateGigById(dispute.gigId, { status: nextGigStatus as never });
            } catch (error) {
                logger.warn('Failed to revert gig status after dispute resolution', {
                    disputeId: dispute.id,
                    gigId: dispute.gigId,
                    error: String(error),
                });
            }
        }

        await dispatch('earnings:dispute-resolved', {
            disputeId: updated.id,
            paymentId: updated.paymentId,
            gigId: updated.gigId,
            resolution: input.resolution,
            resolvedBy: adminId,
        });

        // Touch this to silence the unused reference warning, the earnings
        // repo is wired so a follow-up PR can add Stripe refund / release-to-
        // talent inline here without another constructor change.
        void this.earningsRepository;

        return {
            code: HttpStatus.OK,
            message: 'Dispute Resolved Successfully',
            data: updated,
        };
    };
}

const resolveDispute = new ResolveDispute(new DisputeRepository(), new EarningsRepository(), new GigRepository());

export default resolveDispute;
