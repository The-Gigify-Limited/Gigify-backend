begin;

create extension if not exists pgcrypto;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'report_status') then
        create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed');
    end if;
end $$;

alter table public.gigs
    add column if not exists required_talent_count integer not null default 1;

alter table public.gigs
    drop constraint if exists gigs_required_talent_count_check;

alter table public.gigs
    add constraint gigs_required_talent_count_check check (required_talent_count > 0);

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    gig_id uuid references public.gigs(id) on delete set null,
    reporter_id uuid not null references public.users(id) on delete cascade,
    reported_user_id uuid not null references public.users(id) on delete cascade,
    category text,
    reason text not null,
    status public.report_status not null default 'open',
    resolution_note text,
    reviewed_by uuid references public.users(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists reports_gig_id_idx on public.reports (gig_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_reported_user_id_idx on public.reports (reported_user_id);
create index if not exists reports_status_idx on public.reports (status);

create table if not exists public.payment_release_otps (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid not null references public.payments(id) on delete cascade,
    employer_id uuid not null references public.users(id) on delete cascade,
    code_hash text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    last_sent_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists payment_release_otps_payment_id_idx on public.payment_release_otps (payment_id);
create index if not exists payment_release_otps_employer_id_idx on public.payment_release_otps (employer_id);
create unique index if not exists payment_release_otps_active_idx
    on public.payment_release_otps (payment_id, employer_id)
    where consumed_at is null;

create unique index if not exists conversations_unique_context_idx
    on public.conversations ((coalesce(gig_id, '00000000-0000-0000-0000-000000000000'::uuid)), employer_id, talent_id);

commit;
