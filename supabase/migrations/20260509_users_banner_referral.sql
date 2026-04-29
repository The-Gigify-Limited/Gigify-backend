-- Adds two profile fields the frontend already declares in
-- `server/apiTypes/profile.type.ts:APIBaseSchema`:
--
--   banner_image_url — full-width banner shown above the avatar on the
--                      profile page (set via the edit-profile form)
--   referral         — referral code or attribution string carried on the
--                      user record
--
-- Both are nullable text columns. profile_image_url already exists.

begin;

alter table public.users
    add column if not exists banner_image_url text,
    add column if not exists referral text;

commit;
