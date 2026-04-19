-- Add 'countered' as a new value on the offer_status enum. ALTER TYPE
-- ADD VALUE IF NOT EXISTS is idempotent and runs outside an explicit
-- transaction for compatibility with Postgres's ALTER TYPE rules.

alter type offer_status add value if not exists 'countered';

begin;

alter table public.gig_offers
    add column if not exists counter_amount numeric(10, 2),
    add column if not exists counter_message text,
    add column if not exists accepted_at timestamptz,
    add column if not exists declined_at timestamptz;

commit;
