begin;

-- Rename cover_message -> proposal_message so the API surface matches the
-- Figma wording ("proposal"). Backend code is updated in the same PR, so the
-- rename must be applied in lockstep with the deploy.
alter table public.gig_applications
    rename column cover_message to proposal_message;

alter table public.gig_applications
    add column if not exists proposed_currency text;

commit;
