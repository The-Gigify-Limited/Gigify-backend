-- Adds direct-bank-transfer payout fields the frontend's
-- `TalentProfileSchema` (`server/apiTypes/talent.type.ts`) already declares.
-- The edit-profile screen has the form state wired to these fields
-- (currently commented out in `app/(application)/(dashboard)/profile/
-- edit-profile/page.tsx:106-117`); enabling them server-side unblocks
-- the FE to surface the bank-details inputs.
--
-- NGN context — these are for direct local bank transfers, not Stripe
-- Connect. Stored on talent_profiles for now; if we later move to a
-- dedicated banking table for stronger PII isolation, these columns
-- can be migrated and dropped.

begin;

alter table public.talent_profiles
    add column if not exists bank_name text,
    add column if not exists account_number text;

commit;
