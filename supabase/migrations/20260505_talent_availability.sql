begin;

-- Talent availability calendar, rows represent busy windows (i.e. a talent
-- cannot be booked during [unavailable_from, unavailable_until)). The default
-- state is "available" (no row), so the table stays sparse.
--
-- `source` disambiguates manual user-edited blocks from auto-generated ones
-- created when a talent accepts a gig offer. Auto rows carry `gig_id` so the
-- system can cleanly undo them if the gig is cancelled or the dispute is
-- resolved in the employer's favour.
create table if not exists public.talent_availability (
    id uuid primary key default gen_random_uuid(),
    talent_user_id uuid not null references public.users(id) on delete cascade,
    unavailable_from timestamptz not null,
    unavailable_until timestamptz not null,
    reason text,
    source text not null default 'manual' check (source in ('manual', 'auto_from_gig')),
    gig_id uuid references public.gigs(id) on delete set null,
    created_at timestamptz not null default now(),
    check (unavailable_until > unavailable_from),
    check (source = 'manual' or gig_id is not null)
);

create index if not exists talent_availability_user_range_idx on public.talent_availability (talent_user_id, unavailable_from, unavailable_until);
create index if not exists talent_availability_gig_id_idx on public.talent_availability (gig_id);

commit;
