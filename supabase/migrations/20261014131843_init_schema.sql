-- TuneTalez Phase 1 schema: profiles, series, episodes, my_list, watch_history
-- RLS + GRANTs + secure profile trigger. Seed lives in seed.sql only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  synopsis text not null default '',
  poster_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series (id) on delete cascade,
  episode_number integer not null,
  title text not null default '',
  duration_seconds integer,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  unique (series_id, episode_number)
);

create table public.my_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, series_id)
);

create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  episode_id uuid not null references public.episodes (id) on delete cascade,
  progress_seconds integer not null default 0,
  last_watched_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

-- ---------------------------------------------------------------------------
-- Indexes (policy / join columns)
-- ---------------------------------------------------------------------------

create index episodes_series_id_idx on public.episodes (series_id);
create index my_list_user_id_idx on public.my_list (user_id);
create index my_list_series_id_idx on public.my_list (series_id);
create index watch_history_user_id_idx on public.watch_history (user_id);
create index watch_history_episode_id_idx on public.watch_history (episode_id);
create index series_is_published_sort_idx on public.series (is_published, sort_order);

-- ---------------------------------------------------------------------------
-- Profile trigger (SECURITY DEFINER + empty search_path)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger-only: not callable via PostgREST /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.my_list enable row level security;
alter table public.watch_history enable row level security;

-- ---------------------------------------------------------------------------
-- RLS policies — (select auth.uid()) per Supabase performance guidance
-- ---------------------------------------------------------------------------

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "series_select_published"
  on public.series for select to anon, authenticated
  using (is_published = true);

create policy "episodes_select_published"
  on public.episodes for select to anon, authenticated
  using (
    exists (
      select 1
      from public.series s
      where s.id = episodes.series_id
        and s.is_published = true
    )
  );

create policy "my_list_select_own"
  on public.my_list for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "my_list_insert_own"
  on public.my_list for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "my_list_delete_own"
  on public.my_list for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "watch_history_select_own"
  on public.watch_history for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "watch_history_insert_own"
  on public.watch_history for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "watch_history_update_own"
  on public.watch_history for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- GRANTs (do not rely on default privileges alone)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on table public.series to anon, authenticated;
grant select on table public.episodes to anon, authenticated;

grant select, update on table public.profiles to authenticated;

grant select, insert, delete on table public.my_list to authenticated;

grant select, insert, update on table public.watch_history to authenticated;
