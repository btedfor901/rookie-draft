-- ============================================================
-- Rookie Draft App — Live Draft Session
-- Run this after 001_initial_schema.sql
-- ============================================================

-- Draft session (single row controls live draft state)
create table if not exists public.draft_sessions (
  id            uuid primary key default uuid_generate_v4(),
  is_active     boolean not null default false,
  timer_seconds integer  default null,      -- saved duration for auto-restart
  timer_ends_at timestamptz default null,   -- absolute expiry for current pick clock
  started_at    timestamptz default null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.draft_sessions enable row level security;

create policy "anyone can view draft session"
  on public.draft_sessions for select using (true);

create policy "commissioner can manage draft session"
  on public.draft_sessions for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'commissioner'
    )
  );

-- REPLICA IDENTITY FULL so DELETE events include old row data
-- (needed for undo to propagate correctly to all clients)
alter table public.draft_results  replica identity full;
alter table public.draft_picks    replica identity full;
alter table public.draft_sessions replica identity full;

-- Enable Realtime on tables the live draft room subscribes to
alter publication supabase_realtime add table public.draft_sessions;
alter publication supabase_realtime add table public.draft_results;
alter publication supabase_realtime add table public.draft_picks;
