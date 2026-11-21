-- Poké Track v0.3.3 cloud database setup (safe to run again).
-- Run in YOUR Supabase SQL Editor. The user's email account owns its own data.
-- Does not store or require the service-role/secret API key in the APK.

create table if not exists public.user_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_key text not null,
  value jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, entry_key)
);

alter table public.user_entries enable row level security;

-- Existing policies are retained and are only created when absent.
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_entries' and policyname='Read only own Pokémon progress') then
    create policy "Read only own Pokémon progress" on public.user_entries
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_entries' and policyname='Add only own Pokémon progress') then
    create policy "Add only own Pokémon progress" on public.user_entries
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_entries' and policyname='Update only own Pokémon progress') then
    create policy "Update only own Pokémon progress" on public.user_entries
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end
$policies$;

grant select,insert,update on public.user_entries to authenticated;
-- No DELETE policy: we never silently erase all cloud records.

-- Atomic last-updated-wins MERGE. RLS still applies because this runs as SECURITY INVOKER.
-- The client cannot submit an arbitrary user_id; the database takes it from auth.uid().
-- A stale device update cannot overwrite a newer cloud record on a race.
create or replace function public.merge_user_entries(p_entries jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $body$
declare
  applied integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sign in before syncing Pokémon progress';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries)>250 then
    raise exception 'A sync batch must contain 0 to 250 records';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_entries) as item
    where jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'entry_key') <> 'string'
      or length(item->>'entry_key') < 1
      or length(item->>'entry_key') > 256
      or not (item ? 'value')
      or jsonb_typeof(item->'updated_at') <> 'string'
  ) then
    raise exception 'Invalid record in sync batch';
  end if;

  insert into public.user_entries(user_id,entry_key,value,updated_at)
    select (select auth.uid()),item->>'entry_key',item->'value',
           (item->>'updated_at')::timestamptz
    from jsonb_array_elements(p_entries) as item
  on conflict (user_id,entry_key)
  do update set value=excluded.value,updated_at=excluded.updated_at
    where public.user_entries.updated_at < excluded.updated_at;

  get diagnostics applied = row_count;
  return applied;
end;
$body$;

-- By default PostgreSQL grants execution of new functions to PUBLIC: revoke it.
revoke all on function public.merge_user_entries(jsonb) from public,anon;
grant execute on function public.merge_user_entries(jsonb) to authenticated;

-- Reload PostgREST's function catalog after installation.
notify pgrst, 'reload schema';
