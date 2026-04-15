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

import { UpdateNotificationPreferences } from './index';

describe('UpdateNotificationPreferences service', () => {
    it('updates notification preferences', async () => {
        const notificationPreferenceRepository = {
            upsertByUserId: jest.fn().mockResolvedValue({
                userId: 'user-1',
                emailEnabled: false,
                pushEnabled: true,
                smsEnabled: false,
                marketingEnabled: false,
                gigUpdates: true,
                paymentUpdates: true,
                messageUpdates: true,
                securityAlerts: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }),
        };

        const service = new UpdateNotificationPreferences(notificationPreferenceRepository as never);

        const response = await service.handle({
            input: {
                emailEnabled: false,
                pushEnabled: true,
            },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationPreferenceRepository.upsertByUserId).toHaveBeenCalledWith('user-1', {
            emailEnabled: false,
            pushEnabled: true,
        });
        expect(response.message).toBe('Notification Preferences Updated Successfully');
        expect(response.data.emailEnabled).toBe(false);
    });

    it('handles empty input', async () => {
        const notificationPreferenceRepository = {
            upsertByUserId: jest.fn().mockResolvedValue({
                id: 'pref-1',
                userId: 'user-1',
            }),
        };

        const service = new UpdateNotificationPreferences(notificationPreferenceRepository as never);

        await service.handle({
            input: undefined,
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(notificationPreferenceRepository.upsertByUserId).toHaveBeenCalledWith('user-1', {});
    });

    it('throws when user is not authenticated', async () => {
        const notificationPreferenceRepository = {
            upsertByUserId: jest.fn(),
        };

        const service = new UpdateNotificationPreferences(notificationPreferenceRepository as never);

        await expect(
            service.handle({
                input: {},
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(notificationPreferenceRepository.upsertByUserId).not.toHaveBeenCalled();
    });
});
