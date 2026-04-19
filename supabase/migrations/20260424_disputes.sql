-- ALTER TYPE runs outside an explicit transaction to stay compatible with
-- Postgres's ALTER TYPE rules. Idempotent via IF NOT EXISTS.
alter type gig_status add value if not exists 'disputed';

begin;

create table if not exists public.disputes (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid references public.payments (id),
    gig_id uuid references public.gigs (id),
    raised_by uuid references public.users (id),
    reason text not null,
    description text,
    status text not null default 'open'
        check (status in ('open', 'in_review', 'resolved_talent', 'resolved_employer', 'withdrawn')),
    admin_notes text,
    resolved_at timestamptz,
    resolved_by uuid references public.users (id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists disputes_payment_id_idx on public.disputes (payment_id);
create index if not exists disputes_gig_id_idx on public.disputes (gig_id);
create index if not exists disputes_raised_by_idx on public.disputes (raised_by);
create index if not exists disputes_status_idx on public.disputes (status);

create table if not exists public.dispute_evidence (
    id uuid primary key default gen_random_uuid(),
    dispute_id uuid references public.disputes (id) on delete cascade,
    uploaded_by uuid references public.users (id),
    evidence_type text check (evidence_type in ('screenshot', 'message', 'document', 'other')),
    file_url text,
    notes text,
    created_at timestamptz default now()
);

create index if not exists dispute_evidence_dispute_id_idx on public.dispute_evidence (dispute_id);

commit;
