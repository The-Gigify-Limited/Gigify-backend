begin;

alter table public.gigs
    add column if not exists event_type text,
    add column if not exists start_time time,
    add column if not exists end_time time,
    add column if not exists duration_minutes integer,
    add column if not exists equipment_provided boolean default false,
    add column if not exists dress_code text,
    add column if not exists additional_notes text;

commit;
