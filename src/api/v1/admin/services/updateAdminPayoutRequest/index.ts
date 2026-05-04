import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { EarningsRepository } from '~/earnings/repository';
import { PayoutRequest } from '~/earnings/interfaces';
import { AdminPayoutRequestUpdateDto } from '../../interfaces';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

// PR 3.6 adds external_transfer_id + external_provider onto PayoutRequest;
// this PR merges independently of 3.6, so we soft-read those fields via a
// narrowed view type. Post-3.6 merge they just become always-present.
type PayoutRequestMaybeExternal = {
    externalTransferId?: string | null;
    externalProvider?: string | null;
};

export class UpdateAdminPayoutRequest {
    constructor(private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminPayoutRequestUpdateDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const payoutRequest = await this.earningsRepository.getPayoutRequestById(params.id);

        if (!payoutRequest) throw new RouteNotFoundError('Payout request not found');

        // Schema's conditional validation already requires externalTransferId +
        // externalProvider on 'paid', but keep a service-level guard so bad
        // calls that bypass Joi (e.g. from a future event bus dispatcher)
        // still fail loudly.
        if (input.status === 'paid') {
            if (!input.externalTransferId || !input.externalTransferId.trim()) {
                throw new BadRequestError('externalTransferId is required when marking a payout paid');
            }
            if (!input.externalProvider) {
                throw new BadRequestError('externalProvider is required when marking a payout paid');
            }
        }

        const now = new Date().toISOString();
        const updates: Partial<PayoutRequest> = {
            status: input.status,
            processedAt: input.status === 'requested' ? null : now,
        };

        if (input.status === 'paid') {
            updates.externalTransferId = input.externalTransferId;
            updates.externalProvider = input.externalProvider;
            updates.paidAt = now;
            updates.paidBy = adminId;
        }

        const updatedRequest = await this.earningsRepository.updatePayoutRequest(payoutRequest.id, updates);

        await Promise.all([
            auditService.log({
                userId: adminId,
                action: 'admin_payout_request_updated',
                resourceType: 'payout_request',
                resourceId: updatedRequest.id,
                changes: {
                    status: input.status,
                    externalTransferId: input.status === 'paid' ? input.externalTransferId : undefined,
                    externalProvider: input.status === 'paid' ? input.externalProvider : undefined,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent'])
                    ? request.headers['user-agent'][0] ?? null
                    : request.headers['user-agent'] ?? null,
            }),
            notificationDispatcher.dispatch({
                userId: updatedRequest.talentId,
                type: 'payment_update',
                title: 'Payout request updated',
                message: `Your payout request is now ${input.status}.`,
                payload: {
                    payoutRequestId: updatedRequest.id,
                    status: input.status,
                    externalTransferId: updatedRequest.externalTransferId,
                    externalProvider: updatedRequest.externalProvider,
                },
                preferenceKey: 'paymentUpdates',
            }),
            input.status === 'paid'
                ? dispatch('earnings:payout-paid', {
                      payoutRequestId: updatedRequest.id,
                      talentId: updatedRequest.talentId,
                      amount: updatedRequest.amount,
                      currency: updatedRequest.currency,
                      externalTransferId: (updatedRequest as PayoutRequestMaybeExternal).externalTransferId ?? null,
                      externalProvider: (updatedRequest as PayoutRequestMaybeExternal).externalProvider ?? null,
                  })
                : Promise.resolve(),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Payout Request Updated Successfully',
            data: updatedRequest,
        };
    };
}

const updateAdminPayoutRequest = new UpdateAdminPayoutRequest(new EarningsRepository());
export default updateAdminPayoutRequest;
