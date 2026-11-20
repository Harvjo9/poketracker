-- Poké Track v0.1 — run once in Supabase SQL Editor.
-- Each user owns only their own records; never disable Row Level Security.
create table if not exists public.user_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_key text not null,
  value jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, entry_key)
);

alter table public.user_entries enable row level security;

create policy "Read only own Pokémon progress"
on public.user_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Add only own Pokémon progress"
on public.user_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Update only own Pokémon progress"
on public.user_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- No DELETE policy intentionally: app does not bulk-delete cloud records.
-- If policies already exist, omit/reconcile the corresponding CREATE POLICY statements.
