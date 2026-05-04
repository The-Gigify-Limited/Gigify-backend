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

import { DeleteNotification } from './index';
import { ClearAllNotifications } from '../clearAllNotifications';
import { MarkNotificationUnread } from '../markNotificationUnread';

describe('Notification delete / clearAll / markUnread services', () => {
    it('deletes a single notification scoped to the caller', async () => {
        const repo = { deleteNotification: jest.fn().mockResolvedValue(undefined) };
        const service = new DeleteNotification(repo as never);

        await service.handle({
            params: { id: 'notif-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(repo.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('clears every notification for the caller', async () => {
        const repo = { deleteAllForUser: jest.fn().mockResolvedValue(undefined) };
        const service = new ClearAllNotifications(repo as never);

        await service.handle({ request: { user: { id: 'user-1' } } } as never);

        expect(repo.deleteAllForUser).toHaveBeenCalledWith('user-1');
    });

    it('marks a notification unread', async () => {
        const repo = { markAsUnread: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: false }) };
        const service = new MarkNotificationUnread(repo as never);

        const response = await service.handle({
            params: { id: 'notif-1' },
            request: { user: { id: 'user-1' } },
        } as never);

        expect(repo.markAsUnread).toHaveBeenCalledWith('notif-1', 'user-1');
        expect(response.data).toEqual({ id: 'notif-1', isRead: false });
    });
});
