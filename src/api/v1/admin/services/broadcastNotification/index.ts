import { ControllerArgs, HttpStatus, UnAuthorizedError, auditService } from '@/core';
import { AdminBroadcastNotificationDto } from '../../interfaces';
import { AdminRepository } from '../../repository';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class BroadcastNotification {
    constructor(private readonly adminRepository: AdminRepository) {}

    handle = async ({ input, request }: ControllerArgs<AdminBroadcastNotificationDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const notificationType = input.type ?? 'marketing';
        const preferenceKey = notificationType === 'marketing' ? 'marketingEnabled' : 'securityAlerts';

        const users = await this.adminRepository.getUsers({
            role: input.role,
            status: input.status,
            page: 1,
            pageSize: 500,
        });

        await Promise.all([
            ...users.map((user) =>
                notificationDispatcher.dispatch({
                    userId: user.id,
                    type: notificationType,
                    title: input.title,
                    message: input.message,
                    channel: input.channel ?? 'in_app',
                    payload: {
                        broadcastBy: adminId,
                    },
                    preferenceKey,
                }),
            ),
            auditService.log({
                userId: adminId,
                action: 'admin_broadcast_notification_sent',
                resourceType: 'notification',
                resourceId: adminId,
                changes: {
                    role: input.role ?? null,
                    status: input.status ?? null,
                    recipients: users.length,
                    type: notificationType,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
            }),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Broadcast Notification Sent Successfully',
            data: {
                recipients: users.length,
            },
        };
    };
}

const broadcastNotification = new BroadcastNotification(new AdminRepository());
export default broadcastNotification;
