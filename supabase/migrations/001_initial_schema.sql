-- ============================================================
-- Rookie Draft App — Initial Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type user_role as enum ('commissioner', 'manager');
create type transaction_type as enum ('deposit', 'withdrawal', 'draft_cost', 'trade', 'adjustment', 'auction');
create type draft_status as enum ('available', 'drafted', 'owned');

-- ─── Users (extends auth.users) ───────────────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        user_role not null default 'manager',
  created_at  timestamptz not null default now()
);

-- ─── Fantasy Teams ────────────────────────────────────────────────────────────
create table public.fantasy_teams (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  owner_id      uuid references public.users(id) on delete set null,
  abbreviation  text not null,
  logo_url      text,
  created_at    timestamptz not null default now()
);

-- ─── Players (NFL players — full roster, not just rookies) ───────────────────
create table public.players (
  id              uuid primary key default uuid_generate_v4(),
  first_name      text not null,
  last_name       text not null,
  full_name       text generated always as (first_name || ' ' || last_name) stored,
  position        text not null,
  nfl_team        text,
  age             integer,
  height          text,
  weight          integer,
  jersey_number   integer,
  sleeper_id      text unique,
  espn_id         text unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Roster Slots ─────────────────────────────────────────────────────────────
create table public.roster_slots (
  id               uuid primary key default uuid_generate_v4(),
  fantasy_team_id  uuid not null references public.fantasy_teams(id) on delete cascade,
  player_id        uuid not null references public.players(id) on delete cascade,
  slot_position    text not null,  -- QB, RB, WR, TE, FLEX, K, DEF, BENCH, TAXI, IR
  salary           integer,        -- in cents
  contract_years   integer,
  acquired_via     text,           -- 'draft', 'trade', 'waiver', etc.
  created_at       timestamptz not null default now(),
  unique (fantasy_team_id, player_id)
);

-- ─── Rookie Players ───────────────────────────────────────────────────────────
create table public.rookie_players (
  id                    uuid primary key default uuid_generate_v4(),
  player_id             uuid references public.players(id) on delete set null,
  first_name            text not null,
  last_name             text not null,
  full_name             text generated always as (first_name || ' ' || last_name) stored,
  position              text not null,
  nfl_team              text,
  college               text,
  nfl_draft_round       integer,
  nfl_draft_pick        integer,
  nfl_draft_year        integer not null,
  height                text,
  weight                integer,
  age                   integer,
  depth_chart_position  text,
  strengths             text,
  weaknesses            text,
  fantasy_outlook       text,
  team_fit              text,
  draft_status          draft_status not null default 'available',
  drafted_by_team_id    uuid references public.fantasy_teams(id) on delete set null,
  sleeper_id            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── College Stats ────────────────────────────────────────────────────────────
create table public.college_stats (
  id                  uuid primary key default uuid_generate_v4(),
  rookie_player_id    uuid not null references public.rookie_players(id) on delete cascade,
  season              integer not null,
  team                text not null,
  games               integer,
  -- Passing
  pass_completions    integer,
  pass_attempts       integer,
  pass_yards          integer,
  pass_tds            integer,
  interceptions       integer,
  -- Rushing
  rush_attempts       integer,
  rush_yards          integer,
  rush_tds            integer,
  -- Receiving
  receptions          integer,
  receiving_yards     integer,
  receiving_tds       integer,
  targets             integer,
  created_at          timestamptz not null default now(),
  unique (rookie_player_id, season)
);

-- ─── Depth Chart Snapshots ────────────────────────────────────────────────────
create table public.depth_chart_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  rookie_player_id    uuid not null references public.rookie_players(id) on delete cascade,
  nfl_team            text not null,
  position            text not null,
  depth_order         integer not null,
  snapshot_date       date not null,
  source              text not null default 'manual',
  created_at          timestamptz not null default now()
);

-- ─── Bank Accounts ────────────────────────────────────────────────────────────
create table public.bank_accounts (
  id                uuid primary key default uuid_generate_v4(),
  fantasy_team_id   uuid not null unique references public.fantasy_teams(id) on delete cascade,
  balance           integer not null default 0,  -- in cents
  updated_at        timestamptz not null default now()
);

-- ─── Bank Transactions ────────────────────────────────────────────────────────
create table public.bank_transactions (
  id                uuid primary key default uuid_generate_v4(),
  fantasy_team_id   uuid not null references public.fantasy_teams(id) on delete cascade,
  amount            integer not null,  -- positive = credit, negative = debit (cents)
  type              transaction_type not null,
  description       text not null,
  reference_id      uuid,              -- optional FK to draft_results, trades, etc.
  created_by        uuid not null references public.users(id),
  created_at        timestamptz not null default now()
);

-- ─── Draft Picks ──────────────────────────────────────────────────────────────
create table public.draft_picks (
  id                uuid primary key default uuid_generate_v4(),
  fantasy_team_id   uuid not null references public.fantasy_teams(id) on delete cascade,
  original_team_id  uuid not null references public.fantasy_teams(id),
  draft_year        integer not null,
  draft_round       integer not null,
  pick_number       integer,
  is_used           boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ─── Draft Results ────────────────────────────────────────────────────────────
create table public.draft_results (
  id                  uuid primary key default uuid_generate_v4(),
  draft_pick_id       uuid references public.draft_picks(id) on delete set null,
  rookie_player_id    uuid not null references public.rookie_players(id),
  fantasy_team_id     uuid not null references public.fantasy_teams(id),
  overall_pick        integer not null,
  bid_amount          integer,    -- for auction drafts, in cents
  drafted_at          timestamptz not null default now(),
  unique (rookie_player_id)
);

-- ─── Rookie Notes ─────────────────────────────────────────────────────────────
create table public.rookie_notes (
  id                  uuid primary key default uuid_generate_v4(),
  rookie_player_id    uuid not null references public.rookie_players(id) on delete cascade,
  user_id             uuid not null references public.users(id) on delete cascade,
  note                text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (rookie_player_id, user_id)
);

-- ─── Watchlists ───────────────────────────────────────────────────────────────
create table public.watchlists (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  rookie_player_id    uuid not null references public.rookie_players(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique (user_id, rookie_player_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_roster_slots_team on public.roster_slots(fantasy_team_id);
create index idx_roster_slots_player on public.roster_slots(player_id);
create index idx_rookie_players_position on public.rookie_players(position);
create index idx_rookie_players_status on public.rookie_players(draft_status);
create index idx_bank_transactions_team on public.bank_transactions(fantasy_team_id);
create index idx_draft_picks_team on public.draft_picks(fantasy_team_id);
create index idx_watchlists_user on public.watchlists(user_id);
create index idx_rookie_notes_user on public.rookie_notes(user_id);
create index idx_college_stats_rookie on public.college_stats(rookie_player_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

create trigger set_rookie_players_updated_at
  before update on public.rookie_players
  for each row execute function public.set_updated_at();

create trigger set_bank_accounts_updated_at
  before update on public.bank_accounts
  for each row execute function public.set_updated_at();

create trigger set_rookie_notes_updated_at
  before update on public.rookie_notes
  for each row execute function public.set_updated_at();

-- ─── Auto-insert into public.users on auth signup ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'manager')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.fantasy_teams enable row level security;
alter table public.players enable row level security;
alter table public.roster_slots enable row level security;
alter table public.rookie_players enable row level security;
alter table public.college_stats enable row level security;
alter table public.depth_chart_snapshots enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.draft_picks enable row level security;
alter table public.draft_results enable row level security;
alter table public.rookie_notes enable row level security;
alter table public.watchlists enable row level security;

-- Helper: is the current user a commissioner?
create or replace function public.is_commissioner()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'commissioner'
  );
$$;

-- Helper: get the fantasy team ID for the current user
create or replace function public.my_team_id()
returns uuid language sql security definer as $$
  select id from public.fantasy_teams where owner_id = auth.uid() limit 1;
$$;

-- users: read own row; commissioner reads all
create policy "users_select" on public.users for select
  using (id = auth.uid() or public.is_commissioner());

create policy "users_update_own" on public.users for update
  using (id = auth.uid());

-- fantasy_teams: everyone can read; only commissioner can write
create policy "teams_select_all" on public.fantasy_teams for select
  using (auth.uid() is not null);

create policy "teams_insert_commissioner" on public.fantasy_teams for insert
  with check (public.is_commissioner());

create policy "teams_update_commissioner" on public.fantasy_teams for update
  using (public.is_commissioner());

create policy "teams_delete_commissioner" on public.fantasy_teams for delete
  using (public.is_commissioner());

-- players: read-only for all authenticated users; commissioner can write
create policy "players_select" on public.players for select
  using (auth.uid() is not null);

create policy "players_write_commissioner" on public.players for all
  using (public.is_commissioner());

-- roster_slots: managers see only their team; commissioner sees all
create policy "roster_select_own" on public.roster_slots for select
  using (fantasy_team_id = public.my_team_id() or public.is_commissioner());

create policy "roster_write_commissioner" on public.roster_slots for all
  using (public.is_commissioner());

-- rookie_players: everyone can read; only commissioner can write
create policy "rookies_select" on public.rookie_players for select
  using (auth.uid() is not null);

create policy "rookies_write_commissioner" on public.rookie_players for all
  using (public.is_commissioner());

-- college_stats & depth_chart_snapshots: same read-all / commissioner-write
create policy "college_stats_select" on public.college_stats for select
  using (auth.uid() is not null);

create policy "college_stats_write" on public.college_stats for all
  using (public.is_commissioner());

create policy "depth_chart_select" on public.depth_chart_snapshots for select
  using (auth.uid() is not null);

create policy "depth_chart_write" on public.depth_chart_snapshots for all
  using (public.is_commissioner());

-- bank_accounts: managers see own; commissioner sees all
create policy "bank_select_own" on public.bank_accounts for select
  using (fantasy_team_id = public.my_team_id() or public.is_commissioner());

create policy "bank_write_commissioner" on public.bank_accounts for all
  using (public.is_commissioner());

-- bank_transactions: managers see own; commissioner sees/writes all
create policy "transactions_select_own" on public.bank_transactions for select
  using (fantasy_team_id = public.my_team_id() or public.is_commissioner());

create policy "transactions_write_commissioner" on public.bank_transactions for all
  using (public.is_commissioner());

-- draft_picks: all can read; commissioner writes
create policy "picks_select" on public.draft_picks for select
  using (auth.uid() is not null);

create policy "picks_write_commissioner" on public.draft_picks for all
  using (public.is_commissioner());

-- draft_results: all can read; commissioner writes
create policy "results_select" on public.draft_results for select
  using (auth.uid() is not null);

create policy "results_write_commissioner" on public.draft_results for all
  using (public.is_commissioner());

-- rookie_notes: users manage only their own notes
create policy "notes_select_own" on public.rookie_notes for select
  using (user_id = auth.uid() or public.is_commissioner());

create policy "notes_insert_own" on public.rookie_notes for insert
  with check (user_id = auth.uid());

create policy "notes_update_own" on public.rookie_notes for update
  using (user_id = auth.uid());

create policy "notes_delete_own" on public.rookie_notes for delete
  using (user_id = auth.uid());

-- watchlists: users manage only their own
create policy "watchlist_select_own" on public.watchlists for select
  using (user_id = auth.uid());

create policy "watchlist_insert_own" on public.watchlists for insert
  with check (user_id = auth.uid());

create policy "watchlist_delete_own" on public.watchlists for delete
  using (user_id = auth.uid());
