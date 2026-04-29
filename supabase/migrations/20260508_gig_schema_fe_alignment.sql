-- Aligns the gigs table with the field names the Next.js frontend already
-- declares in `server/apiTypes/gig.type.ts:GigBaseSchema`. Goal: backend
-- accepts and returns exactly the fields the FE sends in CreateGigPayload
-- so no name-mapping shim is required on either side.
--
-- Three operations:
--   1. Rename: start_time → gig_start_time, end_time → gig_end_time,
--      event_type → gig_type
--   2. Replace `equipment_provided` with the inverse `is_equipment_required`
--      (existing rows are migrated by NOT-ing the prior boolean)
--   3. Add new columns: display_image, gig_address, gig_location,
--      gig_post_code, skill_required

begin;

-- 1. Renames — straightforward, no data transformation.
alter table public.gigs rename column start_time to gig_start_time;
alter table public.gigs rename column end_time to gig_end_time;
alter table public.gigs rename column event_type to gig_type;

-- 2. equipment_provided → is_equipment_required (with inversion).
-- Add the new column, populate it as the logical inverse of the old one,
-- then drop the legacy column. NULLs map to NULL so the API can still
-- distinguish "unspecified" from "true / false".
alter table public.gigs add column is_equipment_required boolean;
update public.gigs
    set is_equipment_required = case
        when equipment_provided is null then null
        else not equipment_provided
    end;
alter table public.gigs drop column equipment_provided;

-- 3. New columns.
alter table public.gigs
    add column display_image text,
    add column gig_address text,
    add column gig_location text,
    add column gig_post_code text,
    add column skill_required text;

commit;
