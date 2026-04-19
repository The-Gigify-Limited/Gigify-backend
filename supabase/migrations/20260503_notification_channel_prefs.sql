begin;

-- Per-topic × per-channel preference matrix. The existing global channel
-- toggles (email_enabled / push_enabled / sms_enabled) stay as the outer
-- envelope — if a user turns "email" off globally, every email is suppressed
-- regardless of these per-topic flags. These columns only narrow further.
--
-- Defaults reflect product's opt-in policy: SMS is default-off except for
-- security alerts (trusted channel, low volume, high signal); push is
-- default-on because mobile users expect native alerts for gig / payment /
-- message / security activity.
alter table public.notification_preferences
    add column if not exists sms_gig_updates boolean not null default false,
    add column if not exists sms_payment_updates boolean not null default false,
    add column if not exists sms_security_alerts boolean not null default true,
    add column if not exists push_gig_updates boolean not null default true,
    add column if not exists push_message_updates boolean not null default true,
    add column if not exists push_payment_updates boolean not null default true,
    add column if not exists push_security_alerts boolean not null default true;

commit;
