import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { IdentityVerificationRepository } from '~/user/repository';
import { AdminIdentityVerificationUpdateDto } from '../../interfaces';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class UpdateAdminIdentityVerification {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminIdentityVerificationUpdateDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const verification = await this.identityVerificationRepository.getById(params.id);

        if (!verification) throw new RouteNotFoundError('Identity verification record not found');

        const updatedVerification = await this.identityVerificationRepository.review(verification.id, {
            status: input.status,
            notes: input.notes ?? null,
            reviewedAt: input.status === 'pending' ? null : new Date().toISOString(),
        });

        await Promise.all([
            auditService.log({
                userId: adminId,
                action: 'admin_identity_verification_updated',
                resourceType: 'identity_verification',
                resourceId: updatedVerification.id,
                changes: {
                    status: input.status,
                    notes: input.notes ?? null,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
            }),
            notificationDispatcher.dispatch({
                userId: updatedVerification.userId,
                type: 'security_alert',
                title: 'Identity verification updated',
                message: `Your identity verification is now ${input.status}.`,
                payload: {
                    verificationId: updatedVerification.id,
                    status: input.status,
                },
                preferenceKey: 'securityAlerts',
            }),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Identity Verification Updated Successfully',
            data: updatedVerification,
        };
    };
}

const updateAdminIdentityVerification = new UpdateAdminIdentityVerification(new IdentityVerificationRepository());
export default updateAdminIdentityVerification;
