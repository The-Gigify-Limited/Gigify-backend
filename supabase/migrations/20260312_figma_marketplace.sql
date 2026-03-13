begin;

create extension if not exists pgcrypto;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'application_status') then
        create type public.application_status as enum ('submitted', 'reviewing', 'shortlisted', 'hired', 'rejected', 'withdrawn');
    end if;

    if not exists (select 1 from pg_type where typname = 'payment_status') then
        create type public.payment_status as enum ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');
    end if;

    if not exists (select 1 from pg_type where typname = 'payment_provider') then
        create type public.payment_provider as enum ('manual', 'paystack', 'flutterwave', 'stripe');
    end if;

    if not exists (select 1 from pg_type where typname = 'payout_status') then
        create type public.payout_status as enum ('requested', 'approved', 'paid', 'rejected');
    end if;

    if not exists (select 1 from pg_type where typname = 'notification_channel') then
        create type public.notification_channel as enum ('in_app', 'email', 'push', 'sms');
    end if;

    if not exists (select 1 from pg_type where typname = 'notification_type') then
        create type public.notification_type as enum ('gig_update', 'application_update', 'payment_update', 'message_received', 'security_alert', 'marketing');
    end if;

    if not exists (select 1 from pg_type where typname = 'verification_status') then
        create type public.verification_status as enum ('pending', 'approved', 'rejected');
    end if;

    if not exists (select 1 from pg_type where typname = 'identity_document_type') then
        create type public.identity_document_type as enum ('passport', 'drivers_license', 'national_id', 'selfie_video');
    end if;
end $$;

alter table public.users add column if not exists username text;
alter table public.users add column if not exists gender text;

create unique index if not exists users_username_unique_idx on public.users (lower(username)) where username is not null;
create unique index if not exists employer_profiles_user_id_unique_idx on public.employer_profiles (user_id);
create unique index if not exists talent_profiles_user_id_unique_idx on public.talent_profiles (user_id);

alter table public.gigs alter column status set default 'draft';
alter table public.gigs alter column currency set default 'NGN';

create table if not exists public.gig_applications (
    id uuid primary key default gen_random_uuid(),
    gig_id uuid not null references public.gigs(id) on delete cascade,
    talent_id uuid not null references public.users(id) on delete cascade,
    status public.application_status not null default 'submitted',
    cover_message text,
    proposed_rate numeric(12, 2),
    employer_notes text,
    applied_at timestamptz not null default now(),
    hired_at timestamptz,
    updated_at timestamptz not null default now(),
    unique (gig_id, talent_id)
);

create index if not exists gig_applications_gig_id_idx on public.gig_applications (gig_id);
create index if not exists gig_applications_talent_id_idx on public.gig_applications (talent_id);
create index if not exists gig_applications_status_idx on public.gig_applications (status);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    gig_id uuid references public.gigs(id) on delete set null,
    application_id uuid references public.gig_applications(id) on delete set null,
    employer_id uuid not null references public.users(id) on delete restrict,
    talent_id uuid not null references public.users(id) on delete restrict,
    amount numeric(12, 2) not null check (amount >= 0),
    currency text not null default 'NGN',
    platform_fee numeric(12, 2) not null default 0 check (platform_fee >= 0),
    provider public.payment_provider not null default 'manual',
    payment_reference text,
    status public.payment_status not null default 'pending',
    metadata jsonb not null default '{}'::jsonb,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists payments_reference_unique_idx on public.payments (payment_reference) where payment_reference is not null;
create index if not exists payments_talent_id_idx on public.payments (talent_id);
create index if not exists payments_employer_id_idx on public.payments (employer_id);
create index if not exists payments_status_idx on public.payments (status);

create table if not exists public.payout_requests (
    id uuid primary key default gen_random_uuid(),
    talent_id uuid not null references public.users(id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    currency text not null default 'NGN',
    note text,
    status public.payout_status not null default 'requested',
    processed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists payout_requests_talent_id_idx on public.payout_requests (talent_id);
create index if not exists payout_requests_status_idx on public.payout_requests (status);

create table if not exists public.notification_preferences (
    user_id uuid primary key references public.users(id) on delete cascade,
    email_enabled boolean not null default true,
    push_enabled boolean not null default true,
    sms_enabled boolean not null default false,
    marketing_enabled boolean not null default false,
    gig_updates boolean not null default true,
    payment_updates boolean not null default true,
    message_updates boolean not null default true,
    security_alerts boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into public.notification_preferences (user_id)
select id
from public.users
on conflict (user_id) do nothing;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    type public.notification_type not null,
    title text not null,
    message text,
    channel public.notification_channel not null default 'in_app',
    payload jsonb not null default '{}'::jsonb,
    is_read boolean not null default false,
    read_at timestamptz,
    sent_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

create table if not exists public.saved_gigs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    gig_id uuid not null references public.gigs(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, gig_id)
);

create index if not exists saved_gigs_user_id_idx on public.saved_gigs (user_id);
create index if not exists saved_gigs_gig_id_idx on public.saved_gigs (gig_id);

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    gig_id uuid references public.gigs(id) on delete set null,
    employer_id uuid not null references public.users(id) on delete cascade,
    talent_id uuid not null references public.users(id) on delete cascade,
    last_message_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists conversations_gig_id_idx on public.conversations (gig_id);
create index if not exists conversations_employer_id_idx on public.conversations (employer_id);
create index if not exists conversations_talent_id_idx on public.conversations (talent_id);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references public.users(id) on delete cascade,
    body text not null,
    attachment_url text,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

create table if not exists public.identity_verifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    id_type public.identity_document_type not null,
    media_url text not null,
    selfie_url text,
    status public.verification_status not null default 'pending',
    notes text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists identity_verifications_user_id_idx on public.identity_verifications (user_id);
create index if not exists identity_verifications_status_idx on public.identity_verifications (status);

commit;
