export type UserRole = "commissioner" | "manager";
export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DEF" | "FLEX" | "BENCH" | "IR" | "TAXI";
export type TransactionType = "deposit" | "withdrawal" | "draft_cost" | "trade" | "adjustment" | "auction";
export type DraftStatus = "available" | "drafted" | "owned";

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// ─── Fantasy Teams ────────────────────────────────────────────────────────────
export interface FantasyTeam {
  id: string;
  name: string;
  owner_id: string;
  abbreviation: string;
  logo_url: string | null;
  created_at: string;
  // joined from users
  owner?: User;
}

// ─── Players (NFL roster) ─────────────────────────────────────────────────────
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  nfl_team: string;
  age: number | null;
  height: string | null;
  weight: number | null;
  jersey_number: number | null;
  sleeper_id: string | null;
  espn_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Roster Slots ─────────────────────────────────────────────────────────────
export interface RosterSlot {
  id: string;
  fantasy_team_id: string;
  player_id: string;
  slot_position: Position;
  salary: number | null;
  contract_years: number | null;
  acquired_via: string | null;
  created_at: string;
  // joined
  player?: Player;
  fantasy_team?: FantasyTeam;
}

// ─── Rookie Players ───────────────────────────────────────────────────────────
export interface RookiePlayer {
  id: string;
  player_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  nfl_team: string | null;
  college: string | null;
  nfl_draft_round: number | null;
  nfl_draft_pick: number | null;
  nfl_draft_year: number;
  height: string | null;
  weight: number | null;
  age: number | null;
  depth_chart_position: string | null;
  strengths: string | null;
  weaknesses: string | null;
  fantasy_outlook: string | null;
  team_fit: string | null;
  draft_status: DraftStatus;
  drafted_by_team_id: string | null;
  sleeper_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  drafted_by_team?: FantasyTeam;
  college_stats?: CollegeStat[];
  depth_chart_snapshots?: DepthChartSnapshot[];
}

// ─── College Stats ────────────────────────────────────────────────────────────
export interface CollegeStat {
  id: string;
  rookie_player_id: string;
  season: number;
  team: string;
  games: number | null;
  // Passing
  pass_completions: number | null;
  pass_attempts: number | null;
  pass_yards: number | null;
  pass_tds: number | null;
  interceptions: number | null;
  // Rushing
  rush_attempts: number | null;
  rush_yards: number | null;
  rush_tds: number | null;
  // Receiving
  receptions: number | null;
  receiving_yards: number | null;
  receiving_tds: number | null;
  targets: number | null;
  created_at: string;
}

// ─── Depth Chart Snapshots ────────────────────────────────────────────────────
export interface DepthChartSnapshot {
  id: string;
  rookie_player_id: string;
  nfl_team: string;
  position: string;
  depth_order: number;
  snapshot_date: string;
  source: string;
  created_at: string;
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────
export interface BankAccount {
  id: string;
  fantasy_team_id: string;
  balance: number;
  updated_at: string;
  // joined
  fantasy_team?: FantasyTeam;
}

// ─── Bank Transactions ────────────────────────────────────────────────────────
export interface BankTransaction {
  id: string;
  fantasy_team_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  reference_id: string | null;
  created_by: string;
  created_at: string;
  // joined
  fantasy_team?: FantasyTeam;
}

// ─── Draft Picks ──────────────────────────────────────────────────────────────
export interface DraftPick {
  id: string;
  fantasy_team_id: string;
  original_team_id: string;
  draft_year: number;
  draft_round: number;
  pick_number: number | null;
  is_used: boolean;
  created_at: string;
  // joined
  fantasy_team?: FantasyTeam;
  original_team?: FantasyTeam;
}

// ─── Draft Results ────────────────────────────────────────────────────────────
export interface DraftResult {
  id: string;
  draft_pick_id: string;
  rookie_player_id: string;
  fantasy_team_id: string;
  overall_pick: number;
  bid_amount: number | null;
  drafted_at: string;
  // joined
  draft_pick?: DraftPick;
  rookie_player?: RookiePlayer;
  fantasy_team?: FantasyTeam;
}

// ─── Rookie Notes ─────────────────────────────────────────────────────────────
export interface RookieNote {
  id: string;
  rookie_player_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  // joined
  user?: User;
}

// ─── Watchlists ───────────────────────────────────────────────────────────────
export interface WatchlistEntry {
  id: string;
  user_id: string;
  rookie_player_id: string;
  created_at: string;
  // joined
  rookie_player?: RookiePlayer;
}

// ─── Draft Session ────────────────────────────────────────────────────────────
export interface DraftSession {
  id: string;
  is_active: boolean;
  timer_seconds: number | null;
  timer_ends_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── View / composite types used by the UI ────────────────────────────────────
export interface DashboardData {
  team: FantasyTeam;
  bank: BankAccount;
  rosterSlots: RosterSlot[];
  draftPicks: DraftPick[];
  recentTransactions: BankTransaction[];
}

export interface RookieWithMeta extends RookiePlayer {
  isWatchlisted: boolean;
  userNote: string | null;
  latestDepthChart: DepthChartSnapshot | null;
  finalCollegeSeason: CollegeStat | null;
}
