-- Convert gigs.skill_required from a single text value to a text[] so a
-- gig can declare multiple required skills, then expose a helper function
-- that filters gigs whose array has any element matching a substring
-- (PostgREST has no native ilike-on-array-element operator).

begin;

-- Migrate the column. Existing single-value rows become single-element
-- arrays; null / empty stays null. Use ILIKE-friendly defaults.
alter table public.gigs
    alter column skill_required type text[]
    using case
        when skill_required is null or skill_required = '' then null
        else array[skill_required]
    end;

-- Helper for the search filter. Returns the ids of gigs whose
-- skill_required array contains any element matching the pattern
-- (case-insensitive). The service layer wraps the user input in `%X%`
-- before calling this.
create or replace function public.gigs_matching_skill(pattern text)
returns table (id uuid)
language sql
stable
as $$
    select g.id
    from public.gigs g
    where g.skill_required is not null
      and exists (
          select 1
          from unnest(g.skill_required) as s
          where s ilike pattern
      );
$$;

-- Make the function callable by the service-role client. PostgREST exposes
-- functions in the `public` schema by default; granting EXECUTE makes it
-- explicit and survives policy reviews that strip default privileges.
grant execute on function public.gigs_matching_skill(text) to anon, authenticated, service_role;

commit;
