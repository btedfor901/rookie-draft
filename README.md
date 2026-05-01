# Rookie Draft — Dynasty Fantasy Football App

A private league command center for dynasty fantasy football. Managers log in to view their team, bank, and the rookie draft board. The commissioner has a full admin panel to manage teams, finances, rosters, and run the draft.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark theme) |
| Auth + DB | Supabase (PostgreSQL) |
| Deployment | Vercel or Railway |

---

## Quick Setup

### 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 2. Clone and install

```bash
cd "Rookie Draft"
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your project URL and anon key from **Settings → API**.

### 4. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run the database migration

1. Open your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it.

This creates all tables, enums, triggers, RLS policies, and helper functions.

### 6. Create user accounts

In your Supabase dashboard, go to **Authentication → Users** and use **Add User** to create accounts for:
- Your commissioner (email + password)
- Each team manager (email + password)

After each signup, the `handle_new_user` trigger automatically inserts a row into `public.users`.

**Make yourself commissioner:**
```sql
UPDATE public.users SET role = 'commissioner' WHERE email = 'your@email.com';
```

### 7. Load seed data (optional)

The `supabase/seed.sql` file creates 12 sample teams, bank accounts, 12 sample NFL players, 12 real 2025 draft-class rookies with college stats, and draft picks.

Before running: open the file and replace the commented-out user UUIDs with the real IDs from `auth.users`.

Run in the SQL editor:
```sql
-- Paste and run supabase/seed.sql
```

### 8. Link accounts to teams

In the Admin Panel → Teams & Users tab, assign each user account to their fantasy team.

### 9. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add the three environment variables in the Vercel project dashboard.

### Railway

1. Push to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. Add environment variables.
4. Railway auto-detects Next.js and deploys.

---

## Project Structure

```
├── app/
│   ├── login/              # Login page
│   ├── dashboard/          # Manager dashboard (protected)
│   │   ├── page.tsx        # Dashboard home
│   │   ├── roster/         # Current roster
│   │   ├── bank/           # Bank & transactions
│   │   ├── draft-board/    # Rookie draft board
│   │   └── players/[id]/   # Rookie profile page
│   ├── admin/              # Commissioner admin panel
│   └── auth/               # Auth callback routes
├── components/
│   ├── auth/               # Login form
│   ├── layout/             # Sidebar navigation
│   ├── draft-board/        # Interactive draft board
│   ├── players/            # Notes, watchlist button
│   └── admin/              # All admin tab components
├── lib/
│   ├── supabase/           # Client + server Supabase clients
│   └── utils.ts            # Formatting helpers
├── types/
│   └── database.ts         # All TypeScript types
└── supabase/
    ├── migrations/         # SQL schema
    └── seed.sql            # Sample data
```

---

## Feature Phases

### Phase 1 (Complete)
- [x] Supabase authentication with email/password
- [x] Role-based access (commissioner vs manager)
- [x] Team dashboard with roster, bank, picks
- [x] Roster tab grouped by position
- [x] Bank tab with transaction history
- [x] Rookie Draft Board with filters, sort, watchlist
- [x] Rookie Player Profile with college stats and notes
- [x] Commissioner Admin Panel:
  - Teams & user management
  - Bank transactions
  - Roster management
  - Rookie pool (manual entry + CSV import)
  - Draft management (make picks, undo, export CSV)

### Phase 2 (Next)
- [ ] Live draft mode (real-time pick updates via Supabase Realtime)
- [ ] Depth chart bulk import
- [ ] College stats CSV import per player

### Phase 3 (API Integrations)
- [ ] **Sleeper API** — sync fantasy rosters and league settings
  - Base URL: `https://api.sleeper.app/v1`
  - No API key required
  - TODO: Set `SLEEPER_LEAGUE_ID` in `.env.local`
- [ ] **CollegeFootballData API** — import college career stats
  - TODO: Set `CFBD_API_KEY` in `.env.local`
  - Register free at: https://collegefootballdata.com
- [ ] **NFL depth charts** — SportsDataIO or manual CSV upload
  - TODO: Set `SPORTSDATA_API_KEY` in `.env.local` if using paid tier

---

## Commissioner Workflow

### Setting up the league
1. Create all team manager accounts in Supabase Auth
2. Go to `/admin` → Teams & Users tab
3. Create 12 teams and assign each user to a team
4. Go to Bank tab → set opening balances for each team
5. Go to Rookie Pool tab → import rookies via CSV or add manually

### Running the draft
1. Go to `/admin` → Draft tab
2. Select the pick (owning team) and the rookie player
3. Optionally enter a bid amount (for auction-style drafts)
4. Click **Confirm Pick** — the rookie is marked as drafted and the bank is updated
5. Use **Undo Last Pick** to reverse if needed
6. Export the full draft results to CSV when done

### CSV Import Format for Rookies

```csv
first_name,last_name,position,nfl_team,college,nfl_draft_round,nfl_draft_pick,nfl_draft_year,height,weight,age
Ashton,Jeanty,RB,LV,Boise State,1,6,2025,5'9",215,21
Travis,Hunter,WR,NYJ,Colorado,1,2,2025,6'1",185,21
```

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `users` | Auth users with role (commissioner/manager) |
| `fantasy_teams` | The 12 dynasty teams |
| `players` | All NFL players (for roster) |
| `roster_slots` | Player-to-team assignments with position/salary |
| `rookie_players` | 2025+ draft class with scouting info |
| `college_stats` | Career stats per season per rookie |
| `depth_chart_snapshots` | NFL depth chart snapshots (manual or API) |
| `bank_accounts` | One balance per team |
| `bank_transactions` | Full transaction log |
| `draft_picks` | Owned picks (tradeable) |
| `draft_results` | Completed draft picks |
| `rookie_notes` | Per-manager private notes on rookies |
| `watchlists` | Per-manager watchlisted rookies |

All tables have Row Level Security enabled. Managers only see their own team's data; the commissioner sees everything.
