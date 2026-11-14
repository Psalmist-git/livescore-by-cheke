-- LiveScore by Cheke: account-backed favourite teams and competitions.
-- Run once in Supabase SQL Editor after the profiles migration.

create table if not exists public.favorite_teams (
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id bigint not null,
  team_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

create table if not exists public.favorite_leagues (
  user_id uuid not null references auth.users (id) on delete cascade,
  league_id bigint not null,
  league_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, league_id)
);

alter table public.favorite_teams enable row level security;
alter table public.favorite_leagues enable row level security;

drop policy if exists "Users manage their own favourite teams" on public.favorite_teams;
create policy "Users manage their own favourite teams"
  on public.favorite_teams
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own favourite leagues" on public.favorite_leagues;
create policy "Users manage their own favourite leagues"
  on public.favorite_leagues
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.favorite_teams to authenticated;
grant select, insert, update, delete on public.favorite_leagues to authenticated;

create or replace function public.set_favourite_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists favorite_teams_set_updated_at on public.favorite_teams;
create trigger favorite_teams_set_updated_at
  before update on public.favorite_teams
  for each row execute procedure public.set_favourite_updated_at();

drop trigger if exists favorite_leagues_set_updated_at on public.favorite_leagues;
create trigger favorite_leagues_set_updated_at
  before update on public.favorite_leagues
  for each row execute procedure public.set_favourite_updated_at();
