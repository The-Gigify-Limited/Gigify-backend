const mockFindByUserId = jest.fn();
const mockUpsertByUserId = jest.fn();

jest.mock('@/core', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('./repository', () => ({
    NotificationPreferenceRepository: class NotificationPreferenceRepository {
        findByUserId = mockFindByUserId;
        upsertByUserId = mockUpsertByUserId;
    },
    UserRepository: class UserRepository {},
    ActivityRepository: class ActivityRepository {},
}));

import { checkNotificationPreferenceEventListener } from './listeners';

describe('checkNotificationPreferenceEventListener', () => {
    beforeEach(() => {
        mockFindByUserId.mockReset();
        mockUpsertByUserId.mockReset();
    });

    const fullPrefs = {
        userId: 'user-1',
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: true,
        marketingEnabled: false,
        gigUpdates: true,
        paymentUpdates: true,
        messageUpdates: true,
        securityAlerts: true,
        smsGigUpdates: true,
        smsPaymentUpdates: true,
        smsSecurityAlerts: true,
        pushGigUpdates: true,
        pushMessageUpdates: true,
        pushPaymentUpdates: true,
        pushSecurityAlerts: true,
    };

    it('returns true when topic and channel are both allowed', async () => {
        mockFindByUserId.mockResolvedValue(fullPrefs);
        const ok = await checkNotificationPreferenceEventListener({
            userId: 'user-1',
            preferenceKey: 'paymentUpdates',
            channel: 'email',
        });
        expect(ok).toBe(true);
    });

    it('returns false when topic is allowed but channel is disabled', async () => {
        mockFindByUserId.mockResolvedValue({ ...fullPrefs, emailEnabled: false });
        const ok = await checkNotificationPreferenceEventListener({
            userId: 'user-1',
            preferenceKey: 'paymentUpdates',
            channel: 'email',
        });
        expect(ok).toBe(false);
    });

    it('returns false when topic is disabled regardless of channel', async () => {
        mockFindByUserId.mockResolvedValue({ ...fullPrefs, paymentUpdates: false });
        const ok = await checkNotificationPreferenceEventListener({
            userId: 'user-1',
            preferenceKey: 'paymentUpdates',
            channel: 'email',
        });
        expect(ok).toBe(false);
    });

    it('ignores channel opt-out for in_app since the bell icon is not opt-in', async () => {
        mockFindByUserId.mockResolvedValue({ ...fullPrefs, emailEnabled: false });
        const ok = await checkNotificationPreferenceEventListener({
            userId: 'user-1',
            preferenceKey: 'paymentUpdates',
            channel: 'in_app',
        });
        expect(ok).toBe(true);
    });

    it('upserts an empty row when the user has no preferences yet', async () => {
        mockFindByUserId.mockResolvedValue(null);
        mockUpsertByUserId.mockResolvedValue(fullPrefs);
        const ok = await checkNotificationPreferenceEventListener({
            userId: 'user-1',
            preferenceKey: 'paymentUpdates',
        });
        expect(mockUpsertByUserId).toHaveBeenCalledWith('user-1', {});
        expect(ok).toBe(true);
    });

    describe('per-channel matrix (v2.3)', () => {
        it('allows SMS paymentUpdates when both the sms_<topic> column and smsEnabled are true', async () => {
            mockFindByUserId.mockResolvedValue(fullPrefs);
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'paymentUpdates',
                channel: 'sms',
            });
            expect(ok).toBe(true);
        });

        it('blocks SMS paymentUpdates when sms_payment_updates is off even though the email topic flag is on', async () => {
            mockFindByUserId.mockResolvedValue({ ...fullPrefs, smsPaymentUpdates: false });
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'paymentUpdates',
                channel: 'sms',
            });
            expect(ok).toBe(false);
        });

        it('blocks SMS for topics without an sms_<topic> column (e.g. messageUpdates)', async () => {
            mockFindByUserId.mockResolvedValue(fullPrefs);
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'messageUpdates',
                channel: 'sms',
            });
            expect(ok).toBe(false);
        });

        it('allows push messageUpdates when push_message_updates + pushEnabled are on', async () => {
            mockFindByUserId.mockResolvedValue(fullPrefs);
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'messageUpdates',
                channel: 'push',
            });
            expect(ok).toBe(true);
        });

        it('blocks push messageUpdates when push_message_updates is off', async () => {
            mockFindByUserId.mockResolvedValue({ ...fullPrefs, pushMessageUpdates: false });
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'messageUpdates',
                channel: 'push',
            });
            expect(ok).toBe(false);
        });

        it('blocks push marketing because there is no push_<marketing> column', async () => {
            mockFindByUserId.mockResolvedValue(fullPrefs);
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'marketingEnabled',
                channel: 'push',
            });
            expect(ok).toBe(false);
        });

        it('still respects the global channel toggle (smsEnabled=false beats any sms_<topic>)', async () => {
            mockFindByUserId.mockResolvedValue({ ...fullPrefs, smsEnabled: false });
            const ok = await checkNotificationPreferenceEventListener({
                userId: 'user-1',
                preferenceKey: 'paymentUpdates',
                channel: 'sms',
            });
            expect(ok).toBe(false);
        });
    });
});
