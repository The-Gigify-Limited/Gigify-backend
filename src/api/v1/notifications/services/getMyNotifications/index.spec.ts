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

import { GetMyNotifications } from './index';

describe('GetMyNotifications service', () => {
    it('retrieves notifications for authenticated user', async () => {
        const notificationRepository = {
            getNotificationsForUser: jest.fn().mockResolvedValue([
                {
                    id: 'notif-1',
                    userId: 'user-1',
                    type: 'message_received',
                    isRead: false,
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'notif-2',
                    userId: 'user-1',
                    type: 'application_update',
                    isRead: true,
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ]),
        };

        const service = new GetMyNotifications(notificationRepository as never);

        const response = await service.handle({
            query: { limit: 20 },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationRepository.getNotificationsForUser).toHaveBeenCalledWith('user-1', { limit: 20 });
        expect(response.message).toBe('Notifications Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('returns empty list when no notifications exist', async () => {
        const notificationRepository = {
            getNotificationsForUser: jest.fn().mockResolvedValue([]),
        };

        const service = new GetMyNotifications(notificationRepository as never);

        const response = await service.handle({
            query: {},
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(response.data).toEqual([]);
    });

    it('throws when user is not authenticated', async () => {
        const notificationRepository = {
            getNotificationsForUser: jest.fn(),
        };

        const service = new GetMyNotifications(notificationRepository as never);

        await expect(
            service.handle({
                query: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationRepository.getNotificationsForUser).not.toHaveBeenCalled();
    });
});
