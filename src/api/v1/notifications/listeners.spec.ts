const mockBroadcastToUser = jest.fn();
const mockSendEmail = jest.fn();
const mockCreateNotification = jest.fn();
const mockGetByIdDispatch = jest.fn();

jest.mock('@/core', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    realtimeService: {
        broadcastToUser: mockBroadcastToUser,
    },
}));

jest.mock('@/core/services/mails', () => ({
    sendEmail: mockSendEmail,
}));

jest.mock('@/core/services/mails/views/gigify-auth.view', () => ({
    notificationMail: jest.fn(({ title, message }: { title: string; message: string }) => `${title}:${message}`),
}));

jest.mock('./repository', () => ({
    NotificationRepository: class NotificationRepository {
        createNotification = mockCreateNotification;
    },
}));

jest.mock('@/app', () => ({
    dispatch: mockGetByIdDispatch,
}));

import { dispatchNotificationEventListener } from './listeners';

function buildAppEventManager(overrides: { preference?: unknown[]; user?: unknown[] } = {}) {
    const preference = overrides.preference ?? [true];
    const user = overrides.user ?? [{ email: 'ada@example.com', firstName: 'Ada' }];
    return {
        dispatch: jest.fn().mockImplementation(async (event: string) => {
            if (event === 'user:check-notification-preference') return preference;
            if (event === 'user:get-by-id') return user;
            return [];
        }),
    };
}

describe('dispatchNotificationEventListener', () => {
    beforeEach(() => {
        mockBroadcastToUser.mockReset().mockResolvedValue(undefined);
        mockSendEmail.mockReset().mockResolvedValue(undefined);
        mockCreateNotification.mockReset().mockImplementation((row: Record<string, unknown>) => Promise.resolve({ id: 'notif-1', ...row }));
        mockGetByIdDispatch.mockReset();
    });

    it('broadcasts and persists even when the user has opted out of the topic', async () => {
        const appEventManager = buildAppEventManager({ preference: [false] });

        const result = await dispatchNotificationEventListener({
            userId: 'user-1',
            type: 'payment_update',
            title: 'Escrow funded',
            message: 'Funds are held.',
            preferenceKey: 'paymentUpdates',
            appEventManager: appEventManager as never,
        });

        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-1',
                type: 'payment_update',
                title: 'Escrow funded',
            }),
        );
        expect(mockBroadcastToUser).toHaveBeenCalledWith('user-1', 'new_notification', expect.objectContaining({ id: 'notif-1' }));
        expect(mockSendEmail).not.toHaveBeenCalled();
        expect(result).not.toBeNull();
    });

    it('sends the email when channel is email and preference is on', async () => {
        const appEventManager = buildAppEventManager({ preference: [true] });

        await dispatchNotificationEventListener({
            userId: 'user-1',
            type: 'payment_update',
            title: 'Escrow funded',
            message: 'Funds are held.',
            channel: 'email',
            preferenceKey: 'paymentUpdates',
            appEventManager: appEventManager as never,
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'ada@example.com',
                subject: 'Escrow funded',
            }),
        );
    });

    it('skips the email when channel is email and preference is off, but still broadcasts', async () => {
        const appEventManager = buildAppEventManager({ preference: [false] });

        await dispatchNotificationEventListener({
            userId: 'user-1',
            type: 'payment_update',
            title: 'Escrow funded',
            channel: 'email',
            preferenceKey: 'paymentUpdates',
            appEventManager: appEventManager as never,
        });

        expect(mockBroadcastToUser).toHaveBeenCalled();
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('defaults to allowing the email when no preference listener is available', async () => {
        const appEventManager = buildAppEventManager({ preference: [] });

        await dispatchNotificationEventListener({
            userId: 'user-1',
            type: 'payment_update',
            title: 'Escrow funded',
            channel: 'email',
            preferenceKey: 'paymentUpdates',
            appEventManager: appEventManager as never,
        });

        expect(mockSendEmail).toHaveBeenCalled();
    });

    it('broadcasts even when no preferenceKey is supplied', async () => {
        await dispatchNotificationEventListener({
            userId: 'user-1',
            type: 'security_alert',
            title: 'New sign-in',
        });

        expect(mockBroadcastToUser).toHaveBeenCalled();
    });
});
