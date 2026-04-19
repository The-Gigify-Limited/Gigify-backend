begin;

create table if not exists public.payout_methods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users (id) on delete cascade,
    provider text not null
        check (provider in ('stripe_connect', 'bank', 'paypal')),
    external_account_id text,
    display_label text,
    is_default boolean default false,
    is_verified boolean default false,
    metadata jsonb,
    created_at timestamptz default now()
);

create index if not exists payout_methods_user_id_idx on public.payout_methods (user_id);

-- Partial unique index: at most one default per user.
create unique index if not exists one_default_per_user
    on public.payout_methods (user_id)
    where is_default = true;

commit;
