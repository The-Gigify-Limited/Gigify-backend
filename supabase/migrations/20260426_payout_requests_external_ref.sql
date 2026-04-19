begin;

alter table public.payout_requests
    add column if not exists external_transfer_id text,
    add column if not exists external_provider text
        check (external_provider in ('stripe', 'bank_wire', 'paypal', 'manual')),
    add column if not exists paid_at timestamptz,
    add column if not exists paid_by uuid references public.users (id);

create index if not exists payout_requests_paid_by_idx on public.payout_requests (paid_by);

commit;
