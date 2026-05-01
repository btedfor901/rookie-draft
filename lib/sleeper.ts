export const SLEEPER_LEAGUE_ID = "1244752517808521216";
const BASE = "https://api.sleeper.app/v1";

export interface SleeperLeague {
  name: string;
  league_id: string;
  status: string;
  season: string;
  total_rosters: number;
  roster_positions: string[];
  settings: {
    waiver_budget: number;
    taxi_slots: number;
    reserve_slots: number;
    num_teams: number;
  };
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters: string[] | null;
  reserve: string[] | null;
  taxi: string[] | null;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal: number;
    waiver_budget_used: number;
    waiver_position: number;
  };
  metadata?: Record<string, string>;
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar?: string | null;
  metadata?: {
    team_name?: string;
    team_name_update?: string;
  };
  is_owner?: boolean;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  fantasy_positions?: string[];
  team?: string | null;
  age?: number | null;
  college?: string | null;
  status?: string;
  injury_status?: string | null;
  number?: number | null;
}

export async function fetchLeague(leagueId: string): Promise<SleeperLeague> {
  const res = await fetch(`${BASE}/league/${leagueId}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Sleeper /league fetch ${res.status}`);
  return res.json();
}

export async function fetchRosters(leagueId: string): Promise<SleeperRoster[]> {
  const res = await fetch(`${BASE}/league/${leagueId}/rosters`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Sleeper /rosters fetch ${res.status}`);
  return res.json();
}

export async function fetchUsers(leagueId: string): Promise<SleeperUser[]> {
  const res = await fetch(`${BASE}/league/${leagueId}/users`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Sleeper /users fetch ${res.status}`);
  return res.json();
}

export async function fetchAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  const res = await fetch(`${BASE}/players/nfl`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Sleeper /players fetch ${res.status}`);
  return res.json();
}
