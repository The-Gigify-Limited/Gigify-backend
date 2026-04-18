begin;

alter table public.users
    add column if not exists date_of_birth date,
    add column if not exists street_address text,
    add column if not exists acquisition_source text,
    add column if not exists bio text;

commit;
