-- Seed: Sleeper League 1244752517808521216 — real team names + placeholder auth users
-- Run this AFTER 001_initial_schema.sql and 002_draft_session.sql
-- WARNING: clears existing fantasy team data (teams, bank accounts, transactions, roster slots, picks, results)

-- ── 1. Pre-create placeholder auth users ─────────────────────────────────────
-- Default password for ALL accounts: RookieDraft1!
-- Placeholder emails use @rookiedraft.app — update to real emails before sharing
-- Fixed UUIDs ensure owner_id links below always resolve correctly
-- ON CONFLICT (id) DO NOTHING preserves any account already created with that UUID

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'jaybaseball@rookiedraft.app',    crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'kylefitting@rookiedraft.app',    crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'gphillips20@rookiedraft.app',    crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'flashpointparadox@rookiedraft.app',crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'bosadees@rookiedraft.app',       crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'tricky13@rookiedraft.app',       crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'taylor_cook@rookiedraft.app',    crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'cjmox@rookiedraft.app',          crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'papajbear@rookiedraft.app',      crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'omarsneed@rookiedraft.app',      crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'nick4kz@rookiedraft.app',        crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'peytonm@rookiedraft.app',        crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'tedford901@rookiedraft.app',     crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','',''),
  ('00000000-0000-0000-0001-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'holdingmyhorses@rookiedraft.app',crypt('RookieDraft1!',gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'','','','')
on conflict (id) do nothing;

-- ── 2. Ensure public.users rows exist (trigger may have already created them) ──
insert into public.users (id, email, full_name, role) values
  ('00000000-0000-0000-0001-000000000001', 'jaybaseball@rookiedraft.app',      'Jaybaseball',       'manager'),
  ('00000000-0000-0000-0001-000000000002', 'kylefitting@rookiedraft.app',      'kylefitting',       'manager'),
  ('00000000-0000-0000-0001-000000000003', 'gphillips20@rookiedraft.app',      'gphillips20',       'manager'),
  ('00000000-0000-0000-0001-000000000004', 'flashpointparadox@rookiedraft.app','FlashpointParadox', 'manager'),
  ('00000000-0000-0000-0001-000000000005', 'bosadees@rookiedraft.app',         'BOSADEES',          'manager'),
  ('00000000-0000-0000-0001-000000000006', 'tricky13@rookiedraft.app',         'tricky13',          'manager'),
  ('00000000-0000-0000-0001-000000000007', 'taylor_cook@rookiedraft.app',      'Taylor_Cook',       'manager'),
  ('00000000-0000-0000-0001-000000000008', 'cjmox@rookiedraft.app',            'cjmox',             'manager'),
  ('00000000-0000-0000-0001-000000000009', 'papajbear@rookiedraft.app',        'papaJbear',         'manager'),
  ('00000000-0000-0000-0001-000000000010', 'omarsneed@rookiedraft.app',        'omarsneed',         'manager'),
  ('00000000-0000-0000-0001-000000000011', 'nick4kz@rookiedraft.app',          'Nick4kz',           'manager'),
  ('00000000-0000-0000-0001-000000000012', 'peytonm@rookiedraft.app',          'PeytonM',           'manager'),
  ('00000000-0000-0000-0001-000000000013', 'tedford901@rookiedraft.app',       'Tedford901',        'commissioner'),
  ('00000000-0000-0000-0001-000000000014', 'holdingmyhorses@rookiedraft.app',  'HoldingMyHorses',   'manager')
on conflict (id) do nothing;

-- ── 3. Clear dependent tables in FK order ────────────────────────────────────
truncate table
  public.draft_results,
  public.draft_picks,
  public.bank_transactions,
  public.bank_accounts,
  public.roster_slots,
  public.fantasy_teams
cascade;

-- ── 4. Insert the 14 real teams — owner_id already linked to auth users ───────
insert into public.fantasy_teams (id, name, abbreviation, owner_id, logo_url) values
  ('10000000-0000-0000-0001-000000000001', 'Fly Eagles Fly',    'FEF', '00000000-0000-0000-0001-000000000001', null), -- Jaybaseball
  ('10000000-0000-0000-0001-000000000002', 'Purdy Flowers',     'PF',  '00000000-0000-0000-0001-000000000002', null), -- kylefitting
  ('10000000-0000-0000-0001-000000000003', 'The Jerry Riggers', 'TJR', '00000000-0000-0000-0001-000000000003', null), -- gphillips20
  ('10000000-0000-0000-0001-000000000004', 'Varsity Blues',     'VB',  '00000000-0000-0000-0001-000000000004', null), -- FlashpointParadox
  ('10000000-0000-0000-0001-000000000005', 'Garbage',           'GRB', '00000000-0000-0000-0001-000000000005', null), -- BOSADEES
  ('10000000-0000-0000-0001-000000000006', 'Air Ward',          'AW',  '00000000-0000-0000-0001-000000000006', null), -- tricky13
  ('10000000-0000-0000-0001-000000000007', 'McConkey Kong',     'MCK', '00000000-0000-0000-0001-000000000007', null), -- Taylor_Cook
  ('10000000-0000-0000-0001-000000000008', 'BYE WEEK',          'BYE', '00000000-0000-0000-0001-000000000008', null), -- cjmox
  ('10000000-0000-0000-0001-000000000009', 'papaJbear',         'PJB', '00000000-0000-0000-0001-000000000009', null), -- papaJbear
  ('10000000-0000-0000-0001-000000000010', 'omarsneed',         'OMS', '00000000-0000-0000-0001-000000000010', null), -- omarsneed
  ('10000000-0000-0000-0001-000000000011', 'Bye Week 3',        'BW3', '00000000-0000-0000-0001-000000000011', null), -- Nick4kz
  ('10000000-0000-0000-0001-000000000012', 'The Warren Gaza',   'TWG', '00000000-0000-0000-0001-000000000012', null), -- PeytonM
  ('10000000-0000-0000-0001-000000000013', 'Bye Week',          'BW',  '00000000-0000-0000-0001-000000000013', null), -- Tedford901 (commissioner)
  ('10000000-0000-0000-0001-000000000014', 'Exciting Whites',   'EW',  '00000000-0000-0000-0001-000000000014', null); -- HoldingMyHorses

-- ── 5. Bank accounts with real FAAB balances from Sleeper ($500 cap) ──────────
-- balance stored in cents; $37 remaining = 3700
insert into public.bank_accounts (fantasy_team_id, balance) values
  ('10000000-0000-0000-0001-000000000001',  3700),  -- Fly Eagles Fly    $37
  ('10000000-0000-0000-0001-000000000002',  4200),  -- Purdy Flowers     $42
  ('10000000-0000-0000-0001-000000000003',   100),  -- The Jerry Riggers  $1
  ('10000000-0000-0000-0001-000000000004',   500),  -- Varsity Blues      $5
  ('10000000-0000-0000-0001-000000000005',   500),  -- Garbage            $5
  ('10000000-0000-0000-0001-000000000006', 19100),  -- Air Ward         $191
  ('10000000-0000-0000-0001-000000000007',  1500),  -- McConkey Kong     $15
  ('10000000-0000-0000-0001-000000000008',     0),  -- BYE WEEK           $0
  ('10000000-0000-0000-0001-000000000009',  4000),  -- papaJbear         $40
  ('10000000-0000-0000-0001-000000000010',  3200),  -- omarsneed         $32
  ('10000000-0000-0000-0001-000000000011',  6000),  -- Bye Week 3        $60
  ('10000000-0000-0000-0001-000000000012',  1800),  -- The Warren Gaza   $18
  ('10000000-0000-0000-0001-000000000013', 11700),  -- Bye Week         $117
  ('10000000-0000-0000-0001-000000000014',  2300);  -- Exciting Whites   $23
