-- ============================================================
-- Seed Data — Rookie Draft App
-- WARNING: Run this AFTER creating real auth users in Supabase
-- and replacing the UUIDs below with the real user IDs.
--
-- Quick setup:
--   1. Create users in Supabase Auth dashboard (or via signup page)
--   2. Replace the placeholder UUIDs below with real ones
--   3. Run this script in the Supabase SQL editor
-- ============================================================

-- ─── Sample Users (replace UUIDs with real auth.users IDs) ───────────────────
-- These rows are normally inserted automatically by the handle_new_user trigger.
-- Only run this block manually if you need to backfill.

-- INSERT INTO public.users (id, email, full_name, role) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'commissioner@example.com', 'Chris Commissioner', 'commissioner'),
--   ('00000000-0000-0000-0000-000000000002', 'manager1@example.com',     'Alex Anderson',      'manager'),
--   ('00000000-0000-0000-0000-000000000003', 'manager2@example.com',     'Brian Brown',         'manager'),
--   ('00000000-0000-0000-0000-000000000004', 'manager3@example.com',     'Carlos Cruz',         'manager'),
--   ('00000000-0000-0000-0000-000000000005', 'manager4@example.com',     'Dana Davis',          'manager'),
--   ('00000000-0000-0000-0000-000000000006', 'manager5@example.com',     'Evan Evans',          'manager'),
--   ('00000000-0000-0000-0000-000000000007', 'manager6@example.com',     'Frank Ford',          'manager'),
--   ('00000000-0000-0000-0000-000000000008', 'manager7@example.com',     'Grace Green',         'manager'),
--   ('00000000-0000-0000-0000-000000000009', 'manager8@example.com',     'Hannah Hill',         'manager'),
--   ('00000000-0000-0000-0000-000000000010', 'manager9@example.com',     'Ivan Irwin',          'manager'),
--   ('00000000-0000-0000-0000-000000000011', 'manager10@example.com',    'Jake Jones',          'manager'),
--   ('00000000-0000-0000-0000-000000000012', 'manager11@example.com',    'Karen King',          'manager');

-- ─── Fantasy Teams ────────────────────────────────────────────────────────────
-- Replace owner_id values with real user IDs after auth setup
INSERT INTO public.fantasy_teams (id, name, abbreviation, owner_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Thunder Hawks',      'THK', NULL),
  ('10000000-0000-0000-0000-000000000002', 'Desert Wolves',      'DW',  NULL),
  ('10000000-0000-0000-0000-000000000003', 'Iron Titans',        'IT',  NULL),
  ('10000000-0000-0000-0000-000000000004', 'Coastal Kings',      'CK',  NULL),
  ('10000000-0000-0000-0000-000000000005', 'Mountain Bears',     'MB',  NULL),
  ('10000000-0000-0000-0000-000000000006', 'Neon Dragons',       'ND',  NULL),
  ('10000000-0000-0000-0000-000000000007', 'River Sharks',       'RS',  NULL),
  ('10000000-0000-0000-0000-000000000008', 'Summit Eagles',      'SE',  NULL),
  ('10000000-0000-0000-0000-000000000009', 'Valley Vipers',      'VV',  NULL),
  ('10000000-0000-0000-0000-000000000010', 'Crimson Knights',    'CRK', NULL),
  ('10000000-0000-0000-0000-000000000011', 'Polar Bears',        'PB',  NULL),
  ('10000000-0000-0000-0000-000000000012', 'Solar Flares',       'SF',  NULL);

-- ─── Bank Accounts ────────────────────────────────────────────────────────────
INSERT INTO public.bank_accounts (fantasy_team_id, balance) VALUES
  ('10000000-0000-0000-0000-000000000001', 10000),   -- $100.00
  ('10000000-0000-0000-0000-000000000002', 8500),
  ('10000000-0000-0000-0000-000000000003', 12000),
  ('10000000-0000-0000-0000-000000000004', 7500),
  ('10000000-0000-0000-0000-000000000005', 9000),
  ('10000000-0000-0000-0000-000000000006', 11000),
  ('10000000-0000-0000-0000-000000000007', 6500),
  ('10000000-0000-0000-0000-000000000008', 9500),
  ('10000000-0000-0000-0000-000000000009', 8000),
  ('10000000-0000-0000-0000-000000000010', 10500),
  ('10000000-0000-0000-0000-000000000011', 7000),
  ('10000000-0000-0000-0000-000000000012', 13000);

-- ─── Sample NFL Players ───────────────────────────────────────────────────────
INSERT INTO public.players (id, first_name, last_name, position, nfl_team, age) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Patrick',  'Mahomes',     'QB', 'KC',  29),
  ('20000000-0000-0000-0000-000000000002', 'Lamar',    'Jackson',     'QB', 'BAL', 27),
  ('20000000-0000-0000-0000-000000000003', 'Josh',     'Allen',       'QB', 'BUF', 28),
  ('20000000-0000-0000-0000-000000000004', 'Christian','McCaffrey',   'RB', 'SF',  28),
  ('20000000-0000-0000-0000-000000000005', 'Bijan',    'Robinson',    'RB', 'ATL', 23),
  ('20000000-0000-0000-0000-000000000006', 'Jahmyr',   'Gibbs',       'RB', 'DET', 23),
  ('20000000-0000-0000-0000-000000000007', 'CeeDee',   'Lamb',        'WR', 'DAL', 25),
  ('20000000-0000-0000-0000-000000000008', 'Tyreek',   'Hill',        'WR', 'MIA', 30),
  ('20000000-0000-0000-0000-000000000009', 'Justin',   'Jefferson',   'WR', 'MIN', 25),
  ('20000000-0000-0000-0000-000000000010', 'Amon-Ra',  'St. Brown',   'WR', 'DET', 24),
  ('20000000-0000-0000-0000-000000000011', 'Sam',      'LaPorta',     'TE', 'DET', 23),
  ('20000000-0000-0000-0000-000000000012', 'Travis',   'Kelce',       'TE', 'KC',  35);

-- ─── Roster Slots (Team 1 — Thunder Hawks) ────────────────────────────────────
INSERT INTO public.roster_slots (fantasy_team_id, player_id, slot_position, salary, contract_years, acquired_via) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'QB',    5000, 3, 'draft'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'RB',    6000, 2, 'trade'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'WR',    4500, 4, 'draft'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'WR',    4000, 3, 'waiver'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000011', 'TE',    3000, 2, 'draft');

-- ─── Rookie Players (2025 Draft Class) ───────────────────────────────────────
INSERT INTO public.rookie_players (
  id, first_name, last_name, position, nfl_team, college,
  nfl_draft_round, nfl_draft_pick, nfl_draft_year,
  height, weight, age, depth_chart_position,
  strengths, weaknesses, fantasy_outlook, team_fit, draft_status
) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    'Ashton', 'Jeanty', 'RB', 'LV', 'Boise State',
    1, 6, 2025, '5''9"', 215, 21, 'RB1',
    'Exceptional vision, elite contact balance, high-volume workhorse',
    'Smaller frame, pass protection still developing',
    'Top-5 dynasty RB. Volume is the story — he touches the ball 25+ times a game when healthy.',
    'Fits Las Vegas as an immediate starter in a run-heavy scheme.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Tetairoa', 'McMillan', 'WR', 'CAR', 'Arizona',
    1, 8, 2025, '6''4"', 212, 21, 'WR1',
    'Massive catch radius, contested-catch specialist, elite YAC',
    'Route tree still rounding out, pedestrian 40 time',
    'Could be the #1 WR Carolina has needed. Bryce Young needs a big target.',
    'Perfect scheme fit as an X-receiver in an offense that needs an alpha.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Travis', 'Hunter', 'WR', 'NYJ', 'Colorado',
    1, 2, 2025, '6''1"', 185, 21, 'WR2',
    'Elite athleticism, two-way talent, explosiveness after the catch',
    'NFL-ready route running, durability questions from two-way workload',
    'Upside is massive. Aaron Rodgers could unlock him immediately.',
    'New York needs a playmaker. Hunter provides big-play ability.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Cam', 'Ward', 'QB', 'TEN', 'Miami (FL)',
    1, 1, 2025, '6''2"', 221, 22, 'QB1',
    'Arm talent, mobility, can extend plays, big-game experience',
    'Decision-making under pressure, turnover-prone season at times',
    'First pick means everything. Tennessee will build around him.',
    'Best QB in the class. Takes time but the upside is a top-5 SF QB.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    'Omarion', 'Hampton', 'RB', 'NYG', 'North Carolina',
    1, 10, 2025, '5''11"', 218, 21, 'RB2',
    'Balanced runner, reliable hands out of the backfield, powerful between the tackles',
    'Not an elite athlete, scheme-dependent',
    'Solid RB2 upside if the Giants commit to the run game.',
    'Fits a between-the-tackles scheme. Could compete for early-down role.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    'Emeka', 'Egbuka', 'WR', 'TB', 'Ohio State',
    1, 18, 2025, '6''1"', 195, 22, 'WR2',
    'Polished route runner, reliable hands, proven in a pro-style offense',
    'Lacks elite top-end speed, crowded receiver room',
    'Could carve out a solid WR2/3 role. Baker Mayfield connection is real.',
    'Tampa Bay needs receiver depth. Egbuka could start in year one.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    'Colston', 'Loveland', 'TE', 'CLE', 'Michigan',
    1, 14, 2025, '6''5"', 244, 22, 'TE1',
    'Exceptional athleticism for position, dangerous after the catch',
    'Blocking needs refinement, raw in pass routes',
    'Best TE prospect in years. Could be top-3 TE in dynasty within 2 seasons.',
    'Cleveland gives him a clear path to targets with a new offense.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    'Luther', 'Burden III', 'WR', 'CHI', 'Missouri',
    1, 39, 2025, '6''0"', 206, 21, 'WR3',
    'Exceptional yards after catch, tough over the middle, slot versatility',
    'Outside route limitations, played in a spread offense',
    'Could thrive as a slot WR in Chicago with Caleb Williams.',
    'Slot fit with Williams makes him a sneaky value in the 2nd round.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000009',
    'Jaydn', 'Ott', 'RB', 'PIT', 'California',
    2, 52, 2025, '5''10"', 198, 22, 'RB2',
    'Excellent pass catcher, quick out of the backfield, elusive',
    'Size concerns, not a between-the-tackles runner',
    'Pittsburgh loves their RBs. Could emerge as a PPR darling.',
    'Great fit in the Steelers system that targets backs in the flat.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000010',
    'Jack', 'Bech', 'WR', 'PIT', 'TCU',
    2, 55, 2025, '6''1"', 201, 22, 'WR3',
    'Hands, route running precision, intelligent receiver',
    'Not a burner, yards after catch need improvement',
    'Solid floor as a possession WR. Pittsburgh could feature him in year one.',
    'Works as a complement to George Pickens. Reliable target.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000011',
    'Jonah', 'Savaiinaea', 'OL', 'ARI', 'Arizona',
    1, 11, 2025, '6''4"', 331, 21, 'OT1',
    'Elite pass protector, versatile lineman',
    'Run blocking needs work at the NFL level',
    'No fantasy value as an OL but improves the entire offense.',
    'Arizona builds their line around him for the next decade.',
    'available'
  ),
  (
    '30000000-0000-0000-0000-000000000012',
    'Quinshon', 'Judkins', 'RB', 'CLE', 'Ohio State',
    2, 36, 2025, '5''11"', 213, 22, 'RB1',
    'Power runner, great vision, natural goal-line back',
    'Pass-catching is developing, not a true three-down back yet',
    'Instant RB2 floor with RB1 upside if Cleveland leans on him.',
    'Cleveland needs a ground game. Judkins is the featured back.',
    'available'
  );

-- ─── College Stats ────────────────────────────────────────────────────────────
-- Ashton Jeanty
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds) VALUES
  ('30000000-0000-0000-0000-000000000001', 2023, 'Boise State', 13, 272, 1687, 20, 32, 291, 2),
  ('30000000-0000-0000-0000-000000000001', 2024, 'Boise State', 14, 374, 2601, 29, 29, 254, 2);

-- Tetairoa McMillan
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets) VALUES
  ('30000000-0000-0000-0000-000000000002', 2023, 'Arizona', 13, 90, 1402, 10, 128),
  ('30000000-0000-0000-0000-000000000002', 2024, 'Arizona', 14, 84, 1319, 8, 118);

-- Travis Hunter
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets) VALUES
  ('30000000-0000-0000-0000-000000000003', 2023, 'Colorado', 12, 96, 1152, 14, 136),
  ('30000000-0000-0000-0000-000000000003', 2024, 'Colorado', 13, 96, 1258, 15, 141);

-- Cam Ward
INSERT INTO public.college_stats (rookie_player_id, season, team, games, pass_completions, pass_attempts, pass_yards, pass_tds, interceptions, rush_yards, rush_tds) VALUES
  ('30000000-0000-0000-0000-000000000004', 2023, 'Miami (FL)', 13, 280, 397, 3705, 24, 11, 234, 6),
  ('30000000-0000-0000-0000-000000000004', 2024, 'Miami (FL)', 14, 307, 439, 4313, 39, 7, 180, 5);

-- Omarion Hampton
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds) VALUES
  ('30000000-0000-0000-0000-000000000005', 2023, 'North Carolina', 12, 208, 1163, 13, 27, 215, 1),
  ('30000000-0000-0000-0000-000000000005', 2024, 'North Carolina', 13, 245, 1381, 15, 23, 196, 0);

-- Colston Loveland
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets) VALUES
  ('30000000-0000-0000-0000-000000000007', 2023, 'Michigan', 13, 55, 649, 6, 80),
  ('30000000-0000-0000-0000-000000000007', 2024, 'Michigan', 14, 72, 849, 5, 98);

-- Quinshon Judkins
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds) VALUES
  ('30000000-0000-0000-0000-000000000012', 2022, 'Ole Miss', 13, 255, 1476, 16, 14, 90, 1),
  ('30000000-0000-0000-0000-000000000012', 2023, 'Ole Miss', 13, 232, 1158, 14, 28, 181, 2),
  ('30000000-0000-0000-0000-000000000012', 2024, 'Ohio State', 14, 160, 1060, 16, 18, 115, 2);

-- ─── Draft Picks (each team has picks for 2025 and 2026) ─────────────────────
DO $$
DECLARE
  team_ids uuid[] := ARRAY[
    '10000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    '10000000-0000-0000-0000-000000000010'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '10000000-0000-0000-0000-000000000012'::uuid
  ];
  team_id uuid;
  r integer;
BEGIN
  FOREACH team_id IN ARRAY team_ids LOOP
    FOR r IN 1..4 LOOP
      -- 2025 picks
      INSERT INTO public.draft_picks (fantasy_team_id, original_team_id, draft_year, draft_round)
        VALUES (team_id, team_id, 2025, r);
      -- 2026 picks
      INSERT INTO public.draft_picks (fantasy_team_id, original_team_id, draft_year, draft_round)
        VALUES (team_id, team_id, 2026, r);
    END LOOP;
  END LOOP;
END $$;
