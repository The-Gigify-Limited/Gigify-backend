-- Postgres does not permit running ALTER TYPE ... ADD VALUE inside a
-- transaction that later references the new value, so this migration is
-- intentionally not wrapped in BEGIN/COMMIT. Postgres 12+ tolerates
-- ADD VALUE IF NOT EXISTS in implicit transactions, and Supabase runs on
-- Postgres 15.

alter type gig_status add value if not exists 'expired';
