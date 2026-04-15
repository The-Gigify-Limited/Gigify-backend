jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    NotificationRepository: class NotificationRepository {},
}));

import { MarkNotificationRead } from './index';

describe('MarkNotificationRead service', () => {
    it('marks a notification as read', async () => {
        const notificationRepository = {
            markAsRead: jest.fn().mockResolvedValue({
                id: 'notif-1',
                userId: 'user-1',
                isRead: true,
                updatedAt: '2024-01-01T00:00:00Z',
            }),
        };

        const service = new MarkNotificationRead(notificationRepository as never);

        const response = await service.handle({
            params: { id: 'notif-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationRepository.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
        expect(response.message).toBe('Notification Marked as Read Successfully');
        expect(response.data.isRead).toBe(true);
    });

    it('throws when user is not authenticated', async () => {
        const notificationRepository = {
            markAsRead: jest.fn(),
        };

        const service = new MarkNotificationRead(notificationRepository as never);

        await expect(
            service.handle({
                params: { id: 'notif-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationRepository.markAsRead).not.toHaveBeenCalled();
    });
});
