-- ============================================================
-- 2026 NFL Draft Class — Skill Position Players (QB/RB/WR/TE)
-- Run this in the Supabase SQL editor
-- Source: 2026 NFL Draft results
-- ============================================================

-- Optional: remove old 2025 class first (uncomment if you want a clean slate)
-- DELETE FROM public.rookie_players WHERE nfl_draft_year = 2025;

INSERT INTO public.rookie_players (
  first_name, last_name, position, nfl_team, college,
  nfl_draft_round, nfl_draft_pick, nfl_draft_year,
  fantasy_outlook, draft_status
) VALUES

-- ─── ROUND 1 ──────────────────────────────────────────────────────────────────
(
  'Fernando', 'Mendoza', 'QB', 'LV', 'Indiana',
  1, 1, 2026,
  '#1 overall pick. Built his dynasty resume at Indiana. Inherits a Raiders offense desperate for a franchise QB. High ceiling if the supporting cast develops.',
  'available'
),
(
  'Jeremiyah', 'Love', 'RB', 'ARI', 'Notre Dame',
  1, 3, 2026,
  'Top-3 pick RB is an instant dynasty cornerstone. Love is a three-down back with elite burst and pass-catching ability. Arizona hands him the keys day one.',
  'available'
),
(
  'Carnell', 'Tate', 'WR', 'TEN', 'Ohio State',
  1, 4, 2026,
  'First WR off the board. Polished route runner out of Ohio State with elite hands. Tennessee builds their offense around him alongside Cam Ward.',
  'available'
),
(
  'Jordyn', 'Tyson', 'WR', 'NO', 'Arizona State',
  1, 8, 2026,
  'Top-10 WR prospect with explosive YAC ability. New Orleans gives him a clear path to targets as their WR1.',
  'available'
),
(
  'Ty', 'Simpson', 'QB', 'LAR', 'Alabama',
  1, 13, 2026,
  'Second QB off the board. Patient dynasty hold in LA — will sit behind an established starter before taking over. Big upside if the Rams commit to him.',
  'available'
),
(
  'Kenyon', 'Sadiq', 'TE', 'NYJ', 'Oregon',
  1, 16, 2026,
  'First TE taken in round 1. Instant dynasty TE1 candidate in New York. Elite athleticism and a modern receiving TE skill set.',
  'available'
),
(
  'Makai', 'Lemon', 'WR', 'PHI', 'USC',
  1, 20, 2026,
  'Slot specialist with elite separation. Philadelphia''s offense gives him a great landing spot. PPR dynasty value from day one.',
  'available'
),
(
  'KC', 'Concepcion', 'WR', 'CLE', 'Texas A&M',
  1, 24, 2026,
  'Big-play WR going to Cleveland. Gets paired with a developing QB situation — patience required, but the talent is a round 1 dynasty value.',
  'available'
),
(
  'Omar', 'Cooper Jr.', 'WR', 'NYJ', 'Indiana',
  1, 30, 2026,
  'Late first-round value. Dynamic route runner who put up huge numbers at Indiana alongside Mendoza. Joins a Jets offense with targets to go around.',
  'available'
),
(
  'Jadarian', 'Price', 'RB', 'SEA', 'Notre Dame',
  1, 32, 2026,
  'End-of-round-1 RB steal. Seattle''s run-heavy scheme is the perfect landing spot. Could be a 20-carry-per-game back by year two.',
  'available'
),

-- ─── ROUND 2 ──────────────────────────────────────────────────────────────────
(
  'De''Zhaun', 'Stribling', 'WR', 'SF', 'Mississippi',
  2, 33, 2026,
  'San Francisco WR with big-play upside. Kyle Shanahan loves this type of receiver — great scheme fit with strong dynasty floor.',
  'available'
),
(
  'Germie', 'Bernard', 'WR', 'PIT', 'Alabama',
  2, 47, 2026,
  'Physical WR who thrives contested and after the catch. Pittsburgh adds a legitimate complement to their receiver room.',
  'available'
),
(
  'Eli', 'Stowers', 'TE', 'PHI', 'Vanderbilt',
  2, 54, 2026,
  'Under-the-radar TE2 with upside. Philly already has a TE on the roster but Stowers'' athleticism could push him up the depth chart quickly.',
  'available'
),
(
  'Nate', 'Boerkircher', 'TE', 'JAC', 'Texas A&M',
  2, 56, 2026,
  'Big target for Jacksonville. Should be their starting TE from week one with a clear path to targets.',
  'available'
),
(
  'Marlin', 'Klein', 'TE', 'HOU', 'Michigan',
  2, 59, 2026,
  'Strong blocker who''s developing as a receiver. Houston offense gives him a chance to contribute early. Long-term dynasty stash.',
  'available'
),
(
  'Max', 'Klare', 'TE', 'LAR', 'Ohio State',
  2, 61, 2026,
  'Ohio State TE going to the Rams. McVay loves using TEs — Klare has real TE1 upside in year two of this offense.',
  'available'
),

-- ─── ROUND 3 ──────────────────────────────────────────────────────────────────
(
  'Carson', 'Beck', 'QB', 'ARI', 'Miami',
  3, 65, 2026,
  'Former Georgia QB who put it together at Miami. Arizona already has a young RB in Love — Beck could be their starter sooner than expected.',
  'available'
),
(
  'Antonio', 'Williams', 'WR', 'WSH', 'Clemson',
  3, 71, 2026,
  'Long, physical WR from Clemson. Washington''s offense gives him a clear path to snaps as an outside receiver.',
  'available'
),
(
  'Malachi', 'Fields', 'WR', 'NYG', 'Notre Dame',
  3, 74, 2026,
  'Notre Dame product with reliable hands. New York needs WR help badly — Fields could carve out a WR2 role early.',
  'available'
),
(
  'Caleb', 'Douglas', 'WR', 'MIA', 'Texas Tech',
  3, 75, 2026,
  'Quick slot WR who produces efficiently. Miami adds another weapon to an already stacked offense.',
  'available'
),
(
  'Drew', 'Allar', 'QB', 'PIT', 'Penn State',
  3, 76, 2026,
  'Penn State product with a strong arm and high football IQ. Pittsburgh takes their QB of the future — dynasty stash with 2-year timeline.',
  'available'
),
(
  'Zachariah', 'Branch', 'WR', 'ATL', 'Georgia',
  3, 79, 2026,
  'Blazing speed out of Georgia. Atlanta''s offense could use a burner — Branch stretches the field and creates big plays.',
  'available'
),
(
  'Ja''Kobi', 'Lane', 'WR', 'BAL', 'USC',
  3, 80, 2026,
  'USC WR stepping into a Baltimore offense that loves spreading the ball. Could develop into a WR2 with Lamar at QB.',
  'available'
),
(
  'Chris', 'Brazzell II', 'WR', 'CAR', 'Tennessee',
  3, 83, 2026,
  'Big target who fits Carolina''s need for a reliable outside receiver. Late-round dynasty flier with solid upside.',
  'available'
),
(
  'Zavion', 'Thomas', 'WR', 'CHI', 'LSU',
  3, 89, 2026,
  'LSU WR joining a Caleb Williams offense. Chicago desperately needs weapons — Thomas gets a real shot at volume.',
  'available'
),
(
  'Kaelon', 'Black', 'RB', 'SF', 'Indiana',
  3, 90, 2026,
  'Pass-catching RB in a Shanahan offense — the dream dynasty scenario. Could be the receiving back SF has been looking for.',
  'available'
),
(
  'Eli', 'Raridon', 'TE', 'NE', 'Notre Dame',
  3, 95, 2026,
  'Notre Dame TE going to New England. Patriots love developing TEs — Raridon is a 2-year timeline dynasty stash.',
  'available'
),

-- ─── ROUND 4 ──────────────────────────────────────────────────────────────────
(
  'Brenen', 'Thompson', 'WR', 'LAC', 'Mississippi State',
  4, 105, 2026,
  'Deep threat WR with the speed to test defenses. LA Chargers give him a chance to contribute as a vertical threat.',
  'available'
),
(
  'Cade', 'Klubnik', 'QB', 'NYJ', 'Clemson',
  4, 110, 2026,
  'Dual-threat QB who put up big numbers at Clemson. Jets depth chart is murky — he could push for snaps earlier than expected.',
  'available'
),
(
  'Elijah', 'Sarratt', 'WR', 'BAL', 'Indiana',
  4, 115, 2026,
  'Reliable possession WR. Baltimore adds depth — Sarratt is a safe pair of hands who could see early playing time.',
  'available'
),
(
  'Kaden', 'Wetjen', 'WR', 'PIT', 'Iowa',
  4, 121, 2026,
  'Iowa product known for winning contested catches. Pittsburgh depth chart has opportunity — late-round dynasty flier.',
  'available'
),
(
  'Colbie', 'Young', 'WR', 'CIN', 'Georgia',
  4, 140, 2026,
  'Georgia WR stepping into a Cincinnati offense with Burrow. Ja''Marr Chase will draw coverage — Young could be a sleeper.',
  'available'
),

-- ─── ROUND 5 ──────────────────────────────────────────────────────────────────
(
  'Emmett', 'Johnson', 'RB', 'KC', 'Nebraska',
  5, 161, 2026,
  'Change-of-pace RB for the Chiefs. Kansas City''s offense makes every RB relevant — Johnson is a PPR sleeper.',
  'available'
),
(
  'Nicholas', 'Singleton', 'RB', 'TEN', 'Penn State',
  5, 165, 2026,
  'Explosive Penn State RB joining a Titans backfield. Pairs with Cam Ward — could be a feature back if he wins the job.',
  'available'
),
(
  'Adam', 'Randall', 'RB', 'BAL', 'Clemson',
  5, 174, 2026,
  'Power back going to Baltimore. Ravens love running the ball — Randall is a dynasty handcuff to monitor.',
  'available'
),
(
  'Cyrus', 'Allen', 'WR', 'KC', 'Cincinnati',
  5, 176, 2026,
  'Kansas City WR depth. Mahomes makes everyone relevant — Allen is a late-round dynasty stash with upside.',
  'available'
),
(
  'Kevin', 'Coleman Jr.', 'WR', 'MIA', 'Missouri',
  5, 177, 2026,
  'Explosive slot receiver heading to Miami. De''Von Achane draws defenders — Coleman could get open looks underneath.',
  'available'
),

-- ─── ROUND 6 ──────────────────────────────────────────────────────────────────
(
  'Kaytron', 'Allen', 'RB', 'WSH', 'Penn State',
  6, 187, 2026,
  'Penn State bruiser who paired with Singleton. Washington adds a physical runner — volume dependent on starter injuries.',
  'available'
),
(
  'Barion', 'Brown', 'WR', 'NO', 'LSU',
  6, 190, 2026,
  'Elite speed in rounds. New Orleans needs playmakers — Brown could be a boom-or-bust dynasty lottery ticket.',
  'available'
),
(
  'Demond', 'Claiborne', 'RB', 'MIN', 'Wake Forest',
  6, 198, 2026,
  'Versatile back with receiving chops. Minnesota gives him a shot — handcuff value if he makes the roster.',
  'available'
),
(
  'Emmanuel', 'Henderson Jr.', 'WR', 'SEA', 'Kansas',
  6, 199, 2026,
  'Productive college receiver heading to Seattle. Long-shot dynasty stash — needs to make the 53-man roster first.',
  'available'
),

-- ─── ROUND 7 ──────────────────────────────────────────────────────────────────
(
  'Nicholas', 'Singleton', 'RB', 'TEN', 'Penn State',
  7, 165, 2026,
  'See round 5 entry — this is a duplicate, ignore.',
  'available'
),
(
  'Garrett', 'Nussmeier', 'QB', 'KC', 'LSU',
  7, 249, 2026,
  'LSU product going to Kansas City. Learning behind Mahomes is the best QB school in the league — 3+ year dynasty stash.',
  'available'
),
(
  'Deion', 'Burks', 'WR', 'IND', 'Oklahoma',
  7, 254, 2026,
  'Late-round WR with big-play ability. Indianapolis could use weapons — worth a deep dynasty stash.',
  'available'
),
(
  'Jam', 'Miller', 'RB', 'NE', 'Alabama',
  7, 245, 2026,
  'Alabama RB heading to New England. Patriots always find ways to use their RBs — deep dynasty flier.',
  'available'
),
(
  'Seth', 'McGowan', 'RB', 'IND', 'Kentucky',
  7, 237, 2026,
  'Versatile RB with receiving ability. Colts depth chart has room — low-floor dynasty lottery ticket.',
  'available'
);

-- Fix the duplicate Singleton entry
DELETE FROM public.rookie_players
WHERE first_name = 'Nicholas' AND last_name = 'Singleton'
  AND nfl_draft_year = 2026 AND nfl_draft_pick = 165
  AND ctid NOT IN (
    SELECT min(ctid)
    FROM public.rookie_players
    WHERE first_name = 'Nicholas' AND last_name = 'Singleton' AND nfl_draft_year = 2026
    GROUP BY first_name, last_name, nfl_draft_year
  );

-- ─── College Stats for top prospects ─────────────────────────────────────────

-- Carnell Tate (Ohio State WR)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets)
SELECT id, 2025, 'Ohio State', 14, 62, 891, 9, 89
FROM public.rookie_players WHERE first_name = 'Carnell' AND last_name = 'Tate' AND nfl_draft_year = 2026;

-- Jeremiyah Love (Notre Dame RB)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds)
SELECT id, 2025, 'Notre Dame', 15, 228, 1411, 18, 31, 247, 2
FROM public.rookie_players WHERE first_name = 'Jeremiyah' AND last_name = 'Love' AND nfl_draft_year = 2026;

-- Garrett Nussmeier (LSU QB)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, pass_completions, pass_attempts, pass_yards, pass_tds, interceptions)
SELECT id, 2025, 'LSU', 13, 298, 454, 3978, 31, 10
FROM public.rookie_players WHERE first_name = 'Garrett' AND last_name = 'Nussmeier' AND nfl_draft_year = 2026;

-- Carson Beck (Miami QB — transferred from Georgia)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, pass_completions, pass_attempts, pass_yards, pass_tds, interceptions)
SELECT id, 2025, 'Miami', 12, 246, 378, 3241, 22, 8
FROM public.rookie_players WHERE first_name = 'Carson' AND last_name = 'Beck' AND nfl_draft_year = 2026;

-- Drew Allar (Penn State QB)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, pass_completions, pass_attempts, pass_yards, pass_tds, interceptions)
SELECT id, 2025, 'Penn State', 14, 271, 401, 3512, 27, 6
FROM public.rookie_players WHERE first_name = 'Drew' AND last_name = 'Allar' AND nfl_draft_year = 2026;

-- Nicholas Singleton (Penn State RB)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds)
SELECT id, 2025, 'Penn State', 14, 187, 1089, 12, 28, 198, 1
FROM public.rookie_players WHERE first_name = 'Nicholas' AND last_name = 'Singleton' AND nfl_draft_year = 2026;

-- Kaytron Allen (Penn State RB)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, rush_attempts, rush_yards, rush_tds, receptions, receiving_yards, receiving_tds)
SELECT id, 2025, 'Penn State', 14, 162, 941, 10, 18, 121, 1
FROM public.rookie_players WHERE first_name = 'Kaytron' AND last_name = 'Allen' AND nfl_draft_year = 2026;

-- Jordyn Tyson (Arizona State WR)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets)
SELECT id, 2025, 'Arizona State', 14, 78, 1198, 11, 112
FROM public.rookie_players WHERE first_name = 'Jordyn' AND last_name = 'Tyson' AND nfl_draft_year = 2026;

-- Omar Cooper Jr. (Indiana WR — Mendoza''s target)
INSERT INTO public.college_stats (rookie_player_id, season, team, games, receptions, receiving_yards, receiving_tds, targets)
SELECT id, 2025, 'Indiana', 14, 91, 1312, 12, 134
FROM public.rookie_players WHERE first_name = 'Omar' AND last_name = 'Cooper Jr.' AND nfl_draft_year = 2026;
