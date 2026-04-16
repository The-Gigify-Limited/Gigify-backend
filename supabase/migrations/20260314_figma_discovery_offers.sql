begin;

create extension if not exists pgcrypto;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'offer_status') then
        create type public.offer_status as enum ('pending', 'accepted', 'declined', 'withdrawn', 'expired');
    end if;
end $$;

alter table public.users
    add column if not exists location_latitude numeric(9, 6),
    add column if not exists location_longitude numeric(9, 6);

alter table public.users
    drop constraint if exists users_location_latitude_check;

alter table public.users
    add constraint users_location_latitude_check
    check (location_latitude is null or (location_latitude >= -90 and location_latitude <= 90));

alter table public.users
    drop constraint if exists users_location_longitude_check;

alter table public.users
    add constraint users_location_longitude_check
    check (location_longitude is null or (location_longitude >= -180 and location_longitude <= 180));

alter table public.gigs
    add column if not exists location_latitude numeric(9, 6),
    add column if not exists location_longitude numeric(9, 6);

alter table public.gigs
    drop constraint if exists gigs_location_latitude_check;

alter table public.gigs
    add constraint gigs_location_latitude_check
    check (location_latitude is null or (location_latitude >= -90 and location_latitude <= 90));

alter table public.gigs
    drop constraint if exists gigs_location_longitude_check;

alter table public.gigs
    add constraint gigs_location_longitude_check
    check (location_longitude is null or (location_longitude >= -180 and location_longitude <= 180));

create table if not exists public.gig_offers (
    id uuid primary key default gen_random_uuid(),
    gig_id uuid not null references public.gigs(id) on delete cascade,
    employer_id uuid not null references public.users(id) on delete cascade,
    talent_id uuid not null references public.users(id) on delete cascade,
    message text,
    proposed_rate numeric(12, 2) check (proposed_rate is null or proposed_rate >= 0),
    currency text not null default 'NGN',
    status public.offer_status not null default 'pending',
    expires_at timestamptz,
    responded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists gig_offers_gig_id_idx on public.gig_offers (gig_id);
create index if not exists gig_offers_employer_id_idx on public.gig_offers (employer_id);
create index if not exists gig_offers_talent_id_idx on public.gig_offers (talent_id);
create index if not exists gig_offers_status_idx on public.gig_offers (status);
create unique index if not exists gig_offers_pending_unique_idx
    on public.gig_offers (gig_id, talent_id)
    where status = 'pending';

commit;
