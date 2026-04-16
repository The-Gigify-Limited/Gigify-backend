begin;

alter table public.identity_verifications
    add column if not exists provider text not null default 'manual',
    add column if not exists provider_applicant_id text,
    add column if not exists provider_level_name text,
    add column if not exists provider_review_status text,
    add column if not exists provider_review_result text,
    add column if not exists provider_payload jsonb;

alter table public.identity_verifications
    alter column id_type drop not null,
    alter column media_url drop not null;

create unique index if not exists identity_verifications_provider_applicant_id_key
    on public.identity_verifications (provider_applicant_id)
    where provider_applicant_id is not null;

create index if not exists identity_verifications_user_id_provider_idx
    on public.identity_verifications (user_id, provider, created_at desc);

commit;
