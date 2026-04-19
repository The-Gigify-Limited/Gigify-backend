begin;

-- User-to-user blocks. When A blocks B, A should not receive messages from B
-- and B cannot send to A (checked in chat send path). Keep it mutual-implicit:
-- either direction in the pair implies the block is in effect.
create table if not exists public.user_blocks (
    blocker_id uuid not null references public.users(id) on delete cascade,
    blocked_id uuid not null references public.users(id) on delete cascade,
    reason text,
    created_at timestamptz not null default now(),
    primary key (blocker_id, blocked_id),
    check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

do $$
begin
    if not exists (select 1 from pg_type where typname = 'message_report_status') then
        create type public.message_report_status as enum ('pending', 'reviewing', 'actioned', 'dismissed');
    end if;
end $$;

create table if not exists public.message_reports (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.messages(id) on delete cascade,
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    reporter_id uuid not null references public.users(id) on delete cascade,
    reported_user_id uuid not null references public.users(id) on delete cascade,
    reason text not null,
    description text,
    status public.message_report_status not null default 'pending',
    resolved_by uuid references public.users(id) on delete set null,
    resolved_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists message_reports_status_idx on public.message_reports (status);
create index if not exists message_reports_reporter_id_idx on public.message_reports (reporter_id);
create index if not exists message_reports_reported_user_id_idx on public.message_reports (reported_user_id);
create index if not exists message_reports_message_id_idx on public.message_reports (message_id);

commit;
