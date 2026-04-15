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

import { GetUnreadNotificationCount } from './index';

describe('GetUnreadNotificationCount service', () => {
    it('returns unread notification count for user', async () => {
        const notificationRepository = {
            getUnreadCount: jest.fn().mockResolvedValue(5),
        };

        const service = new GetUnreadNotificationCount(notificationRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('Unread Notification Count Retrieved Successfully');
        expect(response.data.unreadCount).toBe(5);
    });

    it('returns zero when no unread notifications', async () => {
        const notificationRepository = {
            getUnreadCount: jest.fn().mockResolvedValue(0),
        };

        const service = new GetUnreadNotificationCount(notificationRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data.unreadCount).toBe(0);
    });

    it('throws when user is not authenticated', async () => {
        const notificationRepository = {
            getUnreadCount: jest.fn(),
        };

        const service = new GetUnreadNotificationCount(notificationRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationRepository.getUnreadCount).not.toHaveBeenCalled();
    });
});
