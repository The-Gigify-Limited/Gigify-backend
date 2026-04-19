begin;

-- Per-user archive of conversations. Two-person conversations are shared state,
-- but archiving is a personal inbox preference, so it must live in a junction
-- table keyed by (conversation_id, user_id) rather than a flag on conversations.
create table if not exists public.conversation_archives (
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    archived_at timestamptz not null default now(),
    primary key (conversation_id, user_id)
);

create index if not exists conversation_archives_user_id_idx on public.conversation_archives (user_id);

commit;
