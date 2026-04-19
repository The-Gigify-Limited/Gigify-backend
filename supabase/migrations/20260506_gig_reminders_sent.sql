begin;

-- Idempotency table for pre-gig reminders. The reminder scheduler re-runs on
-- a short cadence and a gig can sit inside the (T-24h, T-2h) window across
-- multiple polls, so we need a dedupe key per (gig, user, window). A dedicated
-- table beats a JSONB column on gigs because we can index / delete cleanly if
-- a gig is rescheduled.
create table if not exists public.gig_reminders_sent (
    gig_id uuid not null references public.gigs(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    window_hours integer not null check (window_hours in (24, 2)),
    sent_at timestamptz not null default now(),
    primary key (gig_id, user_id, window_hours)
);

create index if not exists gig_reminders_sent_sent_at_idx on public.gig_reminders_sent (sent_at);

commit;
