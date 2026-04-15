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

import { MarkAllNotificationsRead } from './index';

describe('MarkAllNotificationsRead service', () => {
    it('marks all notifications as read for user', async () => {
        const notificationRepository = {
            markAllAsRead: jest.fn().mockResolvedValue(undefined),
        };

        const service = new MarkAllNotificationsRead(notificationRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Notifications Marked as Read Successfully');
    });

    it('throws when user is not authenticated', async () => {
        const notificationRepository = {
            markAllAsRead: jest.fn(),
        };

        const service = new MarkAllNotificationsRead(notificationRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationRepository.markAllAsRead).not.toHaveBeenCalled();
    });
});
