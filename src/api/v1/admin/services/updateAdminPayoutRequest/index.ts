import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { EarningsRepository } from '~/earnings/repository';
import { AdminPayoutRequestUpdateDto } from '../../interfaces';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class UpdateAdminPayoutRequest {
    constructor(private readonly earningsRepository: EarningsRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminPayoutRequestUpdateDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const payoutRequest = await this.earningsRepository.getPayoutRequestById(params.id);

        if (!payoutRequest) throw new RouteNotFoundError('Payout request not found');

        const updatedRequest = await this.earningsRepository.updatePayoutRequest(payoutRequest.id, {
            status: input.status,
            processedAt: input.status === 'requested' ? null : new Date().toISOString(),
        });

        await Promise.all([
            auditService.log({
                userId: adminId,
                action: 'admin_payout_request_updated',
                resourceType: 'payout_request',
                resourceId: updatedRequest.id,
                changes: {
                    status: input.status,
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
                },
                preferenceKey: 'paymentUpdates',
            }),
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
