jest.mock('@/core', () => {
    class UnAuthorizedError extends Error {}

    return {
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/user/repository', () => ({
    NotificationPreferenceRepository: class NotificationPreferenceRepository {},
}));

import { GetNotificationPreferences } from './index';

describe('GetNotificationPreferences service', () => {
    it('retrieves existing notification preferences', async () => {
        const notificationPreferenceRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                userId: 'user-1',
                emailEnabled: true,
                pushEnabled: true,
                smsEnabled: false,
                marketingEnabled: true,
                gigUpdates: true,
                paymentUpdates: true,
                messageUpdates: true,
                securityAlerts: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }),
            upsertByUserId: jest.fn(),
        };

        const service = new GetNotificationPreferences(notificationPreferenceRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationPreferenceRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(notificationPreferenceRepository.upsertByUserId).not.toHaveBeenCalled();
        expect(response.message).toBe('Notification Preferences Retrieved Successfully');
        expect(response.data.emailEnabled).toBe(true);
    });

    it('creates default preferences if none exist', async () => {
        const notificationPreferenceRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
            upsertByUserId: jest.fn().mockResolvedValue({
                userId: 'user-1',
                emailEnabled: false,
                pushEnabled: false,
                smsEnabled: false,
                marketingEnabled: false,
                gigUpdates: false,
                paymentUpdates: false,
                messageUpdates: false,
                securityAlerts: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }),
        };

        const service = new GetNotificationPreferences(notificationPreferenceRepository as never);

        const response = await service.handle({
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationPreferenceRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(notificationPreferenceRepository.upsertByUserId).toHaveBeenCalledWith('user-1', {});
        expect(response.data).not.toBeNull();
    });

    it('throws when user is not authenticated', async () => {
        const notificationPreferenceRepository = {
            findByUserId: jest.fn(),
            upsertByUserId: jest.fn(),
        };

        const service = new GetNotificationPreferences(notificationPreferenceRepository as never);

        await expect(
            service.handle({
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationPreferenceRepository.findByUserId).not.toHaveBeenCalled();
    });
});
