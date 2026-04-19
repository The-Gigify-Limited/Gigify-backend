begin;

-- Employer bookmarks — mirrors the existing `saved_gigs` junction pattern.
-- `user_id` is intentionally the generic name (rather than `employer_id`)
-- because the FK targets the polymorphic users table; the domain meaning
-- ("who saved it") is enforced at the service layer via role check.
create table if not exists public.saved_talents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    talent_id uuid not null references public.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, talent_id),
    check (user_id <> talent_id)
);

create index if not exists saved_talents_user_id_idx on public.saved_talents (user_id);
create index if not exists saved_talents_talent_id_idx on public.saved_talents (talent_id);

commit;
