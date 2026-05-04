-- gig_types is the canonical lookup of valid event/gig categories that
-- the frontend's "Event Type" dropdown selects from. The application
-- layer requires `gigTypeId` (a uuid FK into this table) on every new
-- gig; the older free-form `gigs.gig_type` text column stays for one
-- deprecation cycle as a denormalized cache so existing reads keep
-- working without a join.

begin;

create table if not exists public.gig_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists gig_types_active_name_idx on public.gig_types (is_active, name);

-- Seed list: union of the frontend dropdown (`eventTypeOptions` in
-- `frontend/constants/dropdownOptions.ts`) and the case-folded distinct
-- values already present in staging (Party, Corporate). The frontend
-- list is currently {Wedding, Party, Corporate, Funeral}; matching that
-- avoids having to migrate the FE dropdown source. New types can be
-- added by inserting rows here later.
insert into public.gig_types (name) values
    ('Wedding'),
    ('Party'),
    ('Corporate'),
    ('Funeral')
on conflict (name) do nothing;

-- Add the FK column. Nullable for now so the backfill can run; the
-- application layer enforces required-on-create from this point on.
alter table public.gigs
    add column if not exists gig_type_id uuid references public.gig_types(id);

create index if not exists gigs_gig_type_id_idx on public.gigs (gig_type_id);

-- Backfill: best-effort case-insensitive match. Anything that doesn't
-- map (e.g. legacy `corporate_launch`) stays null and the application
-- treats it as "no canonical type yet"; the old `gig_type` text remains
-- on the row as a fallback for reads.
update public.gigs g
set gig_type_id = t.id
from public.gig_types t
where g.gig_type is not null
  and g.gig_type ilike t.name;

commit;
