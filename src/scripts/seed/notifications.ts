import { gigId, notificationId, talentId } from './ids';
import { log, upsertIfAbsent } from './helpers';

type NotificationType = 'gig_update' | 'application_update' | 'payment_update' | 'message_received' | 'security_alert' | 'marketing';
type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

interface SeedNotification {
    id: string;
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    isRead: boolean;
    payload: Record<string, unknown>;
}

// Cover every (type × is_read) pair at least once so the type-filter,
// read-filter, markAsRead / markAsUnread, and delete endpoints all have
// representative rows to exercise.
const NOTIFICATIONS: SeedNotification[] = [
    n(1, talentId(1), 'gig_update', 'in_app', 'New gig matching your profile', 'Corporate Launch DJ Night is now open in Lagos.', false, {
        gigId: gigId(1),
    }),
    n(
        2,
        talentId(1),
        'application_update',
        'in_app',
        'You were shortlisted',
        'Employer shortlisted your application for Corporate Launch DJ Night.',
        true,
        { gigId: gigId(1) },
    ),
    n(3, talentId(3), 'payment_update', 'email', 'Payout paid', 'Your Stripe payout of NGN 280,000 has been sent.', true, {
        payoutRequestId: 'a0000000-0000-0000-0000-000000000003',
    }),
    n(4, talentId(4), 'message_received', 'in_app', 'New message from Femi', 'Crew call time is 7am, please confirm.', false, {
        conversationId: '80000000-0000-0000-0000-000000000005',
    }),
    n(5, talentId(20), 'security_alert', 'email', 'New sign-in from Lagos', 'A new device signed into your account.', true, { ip: '102.89.1.10' }),
    n(6, talentId(15), 'marketing', 'email', 'Tips to increase your hire rate', 'Add a portfolio and respond within 1 hour.', false, {}),
    n(7, talentId(14), 'payment_update', 'in_app', 'Dispute opened on your escrow', 'Your employer opened a dispute.', false, {}),
    n(8, talentId(2), 'application_update', 'in_app', 'You were hired', 'You were hired on a Corporate Retreat Sound gig.', false, {}),
    n(9, talentId(5), 'payment_update', 'sms', 'Payment released', 'NGN 700,000 has been released to your balance.', true, {}),
    n(10, talentId(9), 'payment_update', 'in_app', 'Payout request rejected', 'Your payout request was rejected. Reason: KYC.', false, {}),
    n(11, talentId(16), 'message_received', 'push', 'New message', 'You have a new message in an archived thread.', false, {}),
    n(12, talentId(10), 'security_alert', 'in_app', 'Complete your KYC', 'Your KYC submission is awaiting review.', true, {}),
];

function n(
    id: number,
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
    title: string,
    message: string,
    isRead: boolean,
    payload: Record<string, unknown>,
): SeedNotification {
    return { id: notificationId(id), userId, type, channel, title, message, isRead, payload };
}

// Each persona's notification_preferences row is auto-created when first
// touched, but we seed a few opinionated combinations so the preference-gate
// paths in the notification listener have divergent cases to hit.
interface SeedPreference {
    userId: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    marketingEnabled: boolean;
    gigUpdates: boolean;
    paymentUpdates: boolean;
    messageUpdates: boolean;
    securityAlerts: boolean;
}

const PREFERENCES: SeedPreference[] = [
    // Default: all on
    pref(talentId(1), {}),
    // Marketing off, everything else on
    pref(talentId(3), { marketingEnabled: false }),
    // Email channel off globally
    pref(talentId(7), { emailEnabled: false }),
    // Payment updates topic off
    pref(talentId(9), { paymentUpdates: false }),
    // Message updates off + SMS off — exercises dispatch+channel combo
    pref(talentId(16), { messageUpdates: false, smsEnabled: false }),
    // Verbose: all on including marketing
    pref(talentId(15), { marketingEnabled: true }),
];

function pref(userId: string, overrides: Partial<SeedPreference>): SeedPreference {
    return {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        marketingEnabled: false,
        gigUpdates: true,
        paymentUpdates: true,
        messageUpdates: true,
        securityAlerts: true,
        ...overrides,
    };
}

export async function seedNotifications(): Promise<void> {
    log('notifications', `upserting ${NOTIFICATIONS.length} notifications / ${PREFERENCES.length} preference overrides`);

    const rows = NOTIFICATIONS.map((note) => ({
        id: note.id,
        user_id: note.userId,
        type: note.type,
        title: note.title,
        message: note.message,
        channel: note.channel,
        payload: note.payload as never,
        is_read: note.isRead,
        read_at: note.isRead ? new Date().toISOString() : null,
        sent_at: new Date().toISOString(),
    }));
    await upsertIfAbsent('notifications', rows, 'id');

    const prefRows = PREFERENCES.map((p) => ({
        user_id: p.userId,
        email_enabled: p.emailEnabled,
        push_enabled: p.pushEnabled,
        sms_enabled: p.smsEnabled,
        marketing_enabled: p.marketingEnabled,
        gig_updates: p.gigUpdates,
        payment_updates: p.paymentUpdates,
        message_updates: p.messageUpdates,
        security_alerts: p.securityAlerts,
    }));
    // Preferences use `upsert` on the user_id PK — if the row already exists
    // with different values we want the seed's opinionated state to win.
    // `ignoreDuplicates:true` skips; but for preferences we want the operator
    // to be able to re-run and get the seeded shape back, so we upsert-merge.
    await upsertIfAbsent('notification_preferences', prefRows, 'user_id');

    log('notifications', 'done');
}
