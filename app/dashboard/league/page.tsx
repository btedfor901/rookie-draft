import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import {
  SLEEPER_LEAGUE_ID,
  fetchLeague,
  fetchRosters,
  fetchUsers,
  fetchAllPlayers,
  type SleeperPlayer,
} from "@/lib/sleeper";

export const metadata = { title: "League Rosters | Rookie Draft" };
export const revalidate = 0;

const POS_ORDER: Record<string, number> = {
  QB: 0, RB: 1, WR: 2, TE: 3, K: 4, DEF: 5, DB: 6, LB: 7, DL: 8, OL: 9,
};

function posSort(pos?: string) {
  return POS_ORDER[pos ?? ""] ?? 99;
}

interface PlayerRow {
  id: string;
  name: string;
  position: string;
  nflTeam: string;
  age: number | null;
  injuryStatus: string | null;
}

function resolvePlayer(id: string, allPlayers: Record<string, SleeperPlayer>): PlayerRow {
  // DST — Sleeper uses 2–3 char team abbreviation as the player ID
  if (/^[A-Z]{2,3}$/.test(id)) {
    return { id, name: `${id} Defense`, position: "DEF", nflTeam: id, age: null, injuryStatus: null };
  }
  const p = allPlayers[id];
  if (!p) return { id, name: `Player ${id}`, position: "—", nflTeam: "—", age: null, injuryStatus: null };
  return {
    id,
    name: p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || `Player ${id}`,
    position: p.position ?? "—",
    nflTeam: p.team ?? "FA",
    age: p.age ?? null,
    injuryStatus: p.injury_status ?? null,
  };
}

function InjuryBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    Out: "bg-red-900/40 text-red-400 border-red-800",
    Doubtful: "bg-red-900/30 text-red-500 border-red-900",
    Questionable: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    IR: "bg-orange-900/40 text-orange-400 border-orange-800",
  };
  const cls = colors[status] ?? "bg-surface-3 text-gray-400 border-gray-700";
  return (
    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1.5 ${cls}`}>
      {status}
    </span>
  );
}

function PlayerTable({
  players,
  label,
  accent,
}: {
  players: PlayerRow[];
  label: string;
  accent?: string;
}) {
  if (players.length === 0) return null;
  return (
    <div>
      <p className={cn("text-[11px] font-bold uppercase tracking-widest mb-1.5 px-4", accent ?? "text-gray-600")}>
        {label}
      </p>
      {players.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/50 hover:bg-surface-2 transition-colors"
        >
          <span
            className={cn(
              "badge text-[10px] font-bold w-9 text-center shrink-0",
              getPositionBadgeClass(p.position)
            )}
          >
            {p.position}
          </span>
          <span className="flex-1 text-sm font-medium text-gray-100 truncate">
            {p.name}
            <InjuryBadge status={p.injuryStatus} />
          </span>
          <span className="text-xs font-bold text-gray-500 w-8 text-center shrink-0">
            {p.nflTeam !== "FA" ? p.nflTeam : <span className="text-gray-700">FA</span>}
          </span>
          {p.age && (
            <span className="text-xs text-gray-600 w-6 text-right shrink-0">{p.age}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function LeagueRostersPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const [league, rosters, users, allPlayers] = await Promise.all([
    fetchLeague(SLEEPER_LEAGUE_ID),
    fetchRosters(SLEEPER_LEAGUE_ID),
    fetchUsers(SLEEPER_LEAGUE_ID),
    fetchAllPlayers(),
  ]);

  const userMap = new Map(users.map((u) => [u.user_id, u]));
  const totalFAAB = league.settings.waiver_budget;

  const teams = rosters
    .filter((r) => r.owner_id !== null)
    .map((roster) => {
      const user = userMap.get(roster.owner_id!);
      const rawTeamName =
        user?.metadata?.team_name ||
        user?.metadata?.team_name_update ||
        user?.display_name;
      const teamName = rawTeamName ?? `Team ${roster.roster_id}`;
      const ownerName = user?.display_name ?? "Unknown";

      const faabUsed = roster.settings.waiver_budget_used ?? 0;
      const sleeperRemaining = totalFAAB - faabUsed;
      const faabRemaining = Math.min(sleeperRemaining + 300, totalFAAB);

      const allIds = roster.players ?? [];
      const starterSet = new Set((roster.starters ?? []).filter((id) => id !== "0"));
      const reserveSet = new Set(roster.reserve ?? []);
      const taxiSet = new Set(roster.taxi ?? []);
      const benchIds = allIds.filter(
        (id) => !starterSet.has(id) && !reserveSet.has(id) && !taxiSet.has(id)
      );

      const toRows = (ids: Iterable<string>) =>
        Array.from(ids)
          .map((id) => resolvePlayer(id, allPlayers))
          .sort((a, b) => posSort(a.position) - posSort(b.position));

      return {
        rosterId: roster.roster_id,
        teamName,
        ownerName,
        faabRemaining,
        faabUsed,
        wins: roster.settings.wins ?? 0,
        losses: roster.settings.losses ?? 0,
        ties: roster.settings.ties ?? 0,
        fpts: parseFloat(
          `${roster.settings.fpts ?? 0}.${String(roster.settings.fpts_decimal ?? 0).padStart(2, "0")}`
        ),
        starters: toRows(starterSet),
        bench: toRows(benchIds),
        reserve: toRows(reserveSet),
        taxi: toRows(taxiSet),
        totalPlayers: allIds.length,
      };
    })
    .sort((a, b) => b.faabRemaining - a.faabRemaining);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{league.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {teams.length} teams · {league.season} season · ${totalFAAB} FAAB budget
          </p>
        </div>
        <span className="badge text-xs text-gray-500 bg-surface-3 border border-gray-700 capitalize">
          {league.status}
        </span>
      </div>

      {/* FAAB standings strip */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
          FAAB Remaining — Ranked
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {teams.map((team, i) => {
            const pct = Math.round((team.faabRemaining / totalFAAB) * 100);
            const color =
              pct > 50
                ? "text-accent-green"
                : pct > 20
                ? "text-yellow-400"
                : "text-red-400";
            return (
              <div key={team.rosterId} className="card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-600">#{i + 1}</span>
                  <span className="text-[10px] text-gray-600">
                    {team.wins}–{team.losses}
                    {team.ties > 0 ? `–${team.ties}` : ""}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-300 truncate leading-tight">{team.teamName}</p>
                <p className="text-xs text-gray-600 truncate">{team.ownerName}</p>
                <p className={cn("text-base font-bold", color)}>${team.faabRemaining}</p>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      pct > 50 ? "bg-accent-green" : pct > 20 ? "bg-yellow-400" : "bg-red-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team roster cards */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.rosterId} className="card overflow-hidden p-0">
            {/* Team header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-surface-2 flex-wrap gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-100 text-base">{team.teamName}</h2>
                    <span className="text-xs text-gray-500">/ {team.ownerName}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {team.wins}–{team.losses}
                    {team.ties > 0 ? `–${team.ties}` : ""} · {team.fpts.toFixed(1)} pts ·{" "}
                    {team.totalPlayers} players
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] text-gray-600 uppercase tracking-wide">FAAB Remaining</p>
                  <p className="text-xl font-bold text-accent-green">${team.faabRemaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-600 uppercase tracking-wide">Spent</p>
                  <p className="text-xl font-bold text-gray-400">${team.faabUsed}</p>
                </div>
              </div>
            </div>

            {/* Roster */}
            <div className="py-2 divide-y divide-gray-800/0">
              <PlayerTable players={team.starters} label="Starters" accent="text-brand-light" />
              <PlayerTable players={team.bench} label="Bench" />
              {team.taxi.length > 0 && (
                <PlayerTable players={team.taxi} label="Taxi Squad" accent="text-yellow-600" />
              )}
              {team.reserve.length > 0 && (
                <PlayerTable players={team.reserve} label="Injured Reserve" accent="text-orange-600" />
              )}
              {team.totalPlayers === 0 && (
                <p className="px-4 py-5 text-sm text-gray-600">No players on this roster.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
