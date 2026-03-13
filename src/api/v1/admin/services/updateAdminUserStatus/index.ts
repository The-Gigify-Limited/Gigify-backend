import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { AdminUserStatusDto } from '../../interfaces';
import { AdminRepository } from '../../repository';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class UpdateAdminUserStatus {
    constructor(private readonly adminRepository: AdminRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminUserStatusDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const updatedUser = await this.adminRepository.updateUserStatus(params.id, input.status);

        if (!updatedUser) throw new RouteNotFoundError('User not found');

        await Promise.all([
            auditService.log({
                userId: adminId,
                action: 'admin_user_status_updated',
                resourceType: 'user',
                resourceId: updatedUser.id,
                changes: {
                    status: input.status,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
            }),
            notificationDispatcher.dispatch({
                userId: updatedUser.id,
                type: 'security_alert',
                title: input.status === 'suspended' ? 'Account suspended' : 'Account reactivated',
                message:
                    input.status === 'suspended'
                        ? 'Your Gigify account has been suspended by an administrator.'
                        : 'Your Gigify account has been reactivated by an administrator.',
                payload: {
                    status: input.status,
                },
                preferenceKey: 'securityAlerts',
            }),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'User Status Updated Successfully',
            data: updatedUser,
        };
    };
}

const updateAdminUserStatus = new UpdateAdminUserStatus(new AdminRepository());
export default updateAdminUserStatus;
