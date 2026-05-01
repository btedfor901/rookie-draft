import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPositionBadgeClass, formatDate } from "@/lib/utils";
import PlayerNotes from "@/components/players/PlayerNotes";
import WatchlistButton from "@/components/players/WatchlistButton";
import type { CollegeStat, DepthChartSnapshot } from "@/types/database";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("rookie_players").select("full_name").eq("id", id).single();
  return { title: data ? `${data.full_name} | Rookie Draft` : "Player Profile" };
}

// ─── Computed stat helpers ─────────────────────────────────────────────────────
function pct(num: number | null, denom: number | null): string {
  if (!num || !denom) return "—";
  return `${Math.round((num / denom) * 100)}%`;
}
function perGame(val: number | null, games: number | null): string {
  if (!val || !games) return "—";
  return (val / games).toFixed(1);
}
function ypc(yards: number | null, att: number | null): string {
  if (!yards || !att) return "—";
  return (yards / att).toFixed(1);
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const { data: rookie } = await supabase
    .from("rookie_players")
    .select(`
      *,
      drafted_by_team:fantasy_teams(id, name, abbreviation),
      college_stats(*),
      depth_chart_snapshots(*)
    `)
    .eq("id", id)
    .single();

  if (!rookie) notFound();

  const [watchlistRes, noteRes] = await Promise.all([
    supabase.from("watchlists").select("id").eq("user_id", authUser.id).eq("rookie_player_id", id).maybeSingle(),
    supabase.from("rookie_notes").select("*").eq("user_id", authUser.id).eq("rookie_player_id", id).maybeSingle(),
  ]);

  const isWatchlisted = !!watchlistRes.data;
  const existingNote = noteRes.data;

  const collegeStats = [...(rookie.college_stats ?? [])] as CollegeStat[];
  collegeStats.sort((a, b) => a.season - b.season);
  const finalSeason = collegeStats.at(-1) ?? null;

  const depthCharts = [...(rookie.depth_chart_snapshots ?? [])] as DepthChartSnapshot[];
  depthCharts.sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
  const latestDepth = depthCharts[0] ?? null;

  const isQB = rookie.position === "QB";
  const isRB = rookie.position === "RB";
  const isWRTE = rookie.position === "WR" || rookie.position === "TE";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <a href="/dashboard/draft-board" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1.5 w-fit">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Draft Board
      </a>

      {/* Hero card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`badge text-sm font-bold px-3 py-1 ${getPositionBadgeClass(rookie.position)}`}>
                {rookie.position}
              </span>
              {rookie.draft_status === "available" ? (
                <span className="badge text-xs text-accent-green bg-green-900/30 border border-green-800">
                  Available
                </span>
              ) : (
                <span className="badge text-xs text-gray-400 bg-surface-3 border border-gray-700">
                  Drafted{rookie.drafted_by_team ? ` — ${rookie.drafted_by_team.name}` : ""}
                </span>
              )}
              {latestDepth && (
                <span className="badge text-xs text-brand-light bg-blue-900/30 border border-blue-800">
                  {latestDepth.position}{latestDepth.depth_order} on depth chart
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-100">{rookie.full_name}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-400">
              {rookie.nfl_team && <span className="font-semibold text-gray-200 text-base">{rookie.nfl_team}</span>}
              {rookie.college && <span>· {rookie.college}</span>}
              {rookie.age && <span>· {rookie.age} yrs old</span>}
              {rookie.height && <span>· {rookie.height}</span>}
              {rookie.weight && <span>· {rookie.weight} lbs</span>}
            </div>

            <div className="mt-3 text-sm text-gray-500">
              {rookie.nfl_draft_round
                ? `${rookie.nfl_draft_year} NFL Draft — Round ${rookie.nfl_draft_round}, Pick ${rookie.nfl_draft_pick ?? "?"}`
                : `${rookie.nfl_draft_year} UDFA`}
            </div>
          </div>

          <WatchlistButton userId={authUser.id} rookieId={rookie.id} isWatchlisted={isWatchlisted} />
        </div>
      </div>

      {/* Computed stat highlights — only for skill positions */}
      {finalSeason && (isQB || isRB || isWRTE) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isQB && <>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Pass Yards</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.pass_yards?.toLocaleString() ?? "—"}</span>
              <span className="text-xs text-gray-600">{perGame(finalSeason.pass_yards, finalSeason.games)}/gm</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Pass TD / INT</span>
              <span className="text-2xl font-bold text-gray-100">
                {finalSeason.pass_tds ?? "—"}<span className="text-gray-600 text-lg"> / {finalSeason.interceptions ?? "—"}</span>
              </span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Completion %</span>
              <span className="text-2xl font-bold text-gray-100">{pct(finalSeason.pass_completions, finalSeason.pass_attempts)}</span>
              <span className="text-xs text-gray-600">{finalSeason.pass_completions ?? "—"}/{finalSeason.pass_attempts ?? "—"}</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Rush Yards</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.rush_yards?.toLocaleString() ?? "—"}</span>
              <span className="text-xs text-gray-600">{finalSeason.rush_tds ?? "—"} rush TD</span>
            </div>
          </>}

          {isRB && <>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Rush Yards</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.rush_yards?.toLocaleString() ?? "—"}</span>
              <span className="text-xs text-gray-600">{perGame(finalSeason.rush_yards, finalSeason.games)}/gm</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">YPC</span>
              <span className="text-2xl font-bold text-gray-100">{ypc(finalSeason.rush_yards, finalSeason.rush_attempts)}</span>
              <span className="text-xs text-gray-600">{finalSeason.rush_attempts ?? "—"} carries</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Rush TD</span>
              <span className="text-2xl font-bold text-accent-green">{finalSeason.rush_tds ?? "—"}</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Receiving</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.receptions ?? "—"} rec</span>
              <span className="text-xs text-gray-600">{finalSeason.receiving_yards ?? "—"} yds · {finalSeason.receiving_tds ?? "—"} TD</span>
            </div>
          </>}

          {isWRTE && <>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Receptions</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.receptions ?? "—"}</span>
              <span className="text-xs text-gray-600">{perGame(finalSeason.receptions, finalSeason.games)}/gm</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Rec Yards</span>
              <span className="text-2xl font-bold text-gray-100">{finalSeason.receiving_yards?.toLocaleString() ?? "—"}</span>
              <span className="text-xs text-gray-600">{perGame(finalSeason.receiving_yards, finalSeason.games)}/gm</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Catch Rate</span>
              <span className="text-2xl font-bold text-gray-100">{pct(finalSeason.receptions, finalSeason.targets)}</span>
              <span className="text-xs text-gray-600">{finalSeason.targets ?? "—"} targets</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500 font-medium">Rec TD</span>
              <span className="text-2xl font-bold text-accent-green">{finalSeason.receiving_tds ?? "—"}</span>
              <span className="text-xs text-gray-600">{ypc(finalSeason.receiving_yards, finalSeason.receptions)} YPR</span>
            </div>
          </>}
        </div>
      )}

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fantasy outlook */}
        <div className="card">
          <h2 className="section-title mb-3">Fantasy Outlook</h2>
          {rookie.fantasy_outlook ? (
            <p className="text-sm text-gray-300 leading-relaxed">{rookie.fantasy_outlook}</p>
          ) : (
            <p className="text-sm text-gray-600 italic">No outlook added yet.</p>
          )}
          {rookie.team_fit && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 font-medium mb-1">Team Fit</p>
              <p className="text-sm text-gray-300 leading-relaxed">{rookie.team_fit}</p>
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="card">
          <h2 className="section-title mb-3">Scouting Report</h2>
          {rookie.strengths && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-accent-green mb-1.5">Strengths</p>
              <p className="text-sm text-gray-300 leading-relaxed">{rookie.strengths}</p>
            </div>
          )}
          {rookie.weaknesses && (
            <div className={rookie.strengths ? "pt-4 border-t border-gray-800" : ""}>
              <p className="text-xs font-semibold text-accent-red mb-1.5">Weaknesses</p>
              <p className="text-sm text-gray-300 leading-relaxed">{rookie.weaknesses}</p>
            </div>
          )}
          {!rookie.strengths && !rookie.weaknesses && (
            <p className="text-sm text-gray-600 italic">No scouting report added yet.</p>
          )}
        </div>
      </div>

      {/* College career stats table */}
      {collegeStats.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="p-5 border-b border-gray-800">
            <h2 className="section-title">College Career Stats</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-surface-2">
                  <th className="table-header text-left">Season</th>
                  <th className="table-header text-left">School</th>
                  <th className="table-header text-right">G</th>
                  {isQB && <>
                    <th className="table-header text-right">CMP</th>
                    <th className="table-header text-right">ATT</th>
                    <th className="table-header text-right">CMP%</th>
                    <th className="table-header text-right">PaYds</th>
                    <th className="table-header text-right">PaTD</th>
                    <th className="table-header text-right">INT</th>
                    <th className="table-header text-right">RuYds</th>
                    <th className="table-header text-right">RuTD</th>
                  </>}
                  {isRB && <>
                    <th className="table-header text-right">Att</th>
                    <th className="table-header text-right">RuYds</th>
                    <th className="table-header text-right">YPC</th>
                    <th className="table-header text-right">RuTD</th>
                    <th className="table-header text-right">Rec</th>
                    <th className="table-header text-right">Tgt</th>
                    <th className="table-header text-right">ReYds</th>
                    <th className="table-header text-right">ReTD</th>
                  </>}
                  {isWRTE && <>
                    <th className="table-header text-right">Tgt</th>
                    <th className="table-header text-right">Rec</th>
                    <th className="table-header text-right">Ctch%</th>
                    <th className="table-header text-right">Yds</th>
                    <th className="table-header text-right">YPR</th>
                    <th className="table-header text-right">TD</th>
                    <th className="table-header text-right">Yds/G</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {collegeStats.map((stat) => (
                  <tr key={stat.id} className={`table-row ${stat === finalSeason ? "bg-brand/5" : ""}`}>
                    <td className="table-cell font-semibold">
                      {stat.season}
                      {stat === finalSeason && <span className="ml-1.5 text-xs text-brand-light">(final)</span>}
                    </td>
                    <td className="table-cell text-gray-400">{stat.team}</td>
                    <td className="table-cell text-right text-gray-400">{stat.games ?? "—"}</td>
                    {isQB && <>
                      <td className="table-cell text-right">{stat.pass_completions ?? "—"}</td>
                      <td className="table-cell text-right">{stat.pass_attempts ?? "—"}</td>
                      <td className="table-cell text-right">{pct(stat.pass_completions, stat.pass_attempts)}</td>
                      <td className="table-cell text-right font-medium">{stat.pass_yards?.toLocaleString() ?? "—"}</td>
                      <td className="table-cell text-right text-accent-green">{stat.pass_tds ?? "—"}</td>
                      <td className="table-cell text-right text-accent-red">{stat.interceptions ?? "—"}</td>
                      <td className="table-cell text-right">{stat.rush_yards?.toLocaleString() ?? "—"}</td>
                      <td className="table-cell text-right text-accent-green">{stat.rush_tds ?? "—"}</td>
                    </>}
                    {isRB && <>
                      <td className="table-cell text-right">{stat.rush_attempts ?? "—"}</td>
                      <td className="table-cell text-right font-medium">{stat.rush_yards?.toLocaleString() ?? "—"}</td>
                      <td className="table-cell text-right">{ypc(stat.rush_yards, stat.rush_attempts)}</td>
                      <td className="table-cell text-right text-accent-green">{stat.rush_tds ?? "—"}</td>
                      <td className="table-cell text-right">{stat.receptions ?? "—"}</td>
                      <td className="table-cell text-right text-gray-500">{stat.targets ?? "—"}</td>
                      <td className="table-cell text-right">{stat.receiving_yards?.toLocaleString() ?? "—"}</td>
                      <td className="table-cell text-right text-accent-green">{stat.receiving_tds ?? "—"}</td>
                    </>}
                    {isWRTE && <>
                      <td className="table-cell text-right">{stat.targets ?? "—"}</td>
                      <td className="table-cell text-right font-medium">{stat.receptions ?? "—"}</td>
                      <td className="table-cell text-right">{pct(stat.receptions, stat.targets)}</td>
                      <td className="table-cell text-right font-medium">{stat.receiving_yards?.toLocaleString() ?? "—"}</td>
                      <td className="table-cell text-right">{ypc(stat.receiving_yards, stat.receptions)}</td>
                      <td className="table-cell text-right text-accent-green">{stat.receiving_tds ?? "—"}</td>
                      <td className="table-cell text-right">{perGame(stat.receiving_yards, stat.games)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Depth chart history */}
      {depthCharts.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">NFL Depth Chart History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="table-header text-left">Date</th>
                  <th className="table-header text-left">NFL Team</th>
                  <th className="table-header text-left">Position</th>
                  <th className="table-header text-left">Depth</th>
                  <th className="table-header text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {depthCharts.map((d, i) => (
                  <tr key={d.id} className={`table-row ${i === 0 ? "bg-brand/5" : ""}`}>
                    <td className="table-cell text-gray-400 text-xs">
                      {d.snapshot_date}
                      {i === 0 && <span className="ml-2 text-brand-light text-xs">(latest)</span>}
                    </td>
                    <td className="table-cell font-mono text-gray-300">{d.nfl_team}</td>
                    <td className="table-cell">{d.position}</td>
                    <td className="table-cell">
                      <span className={`badge text-xs border ${d.depth_order === 1
                        ? "text-accent-green bg-green-900/30 border-green-800"
                        : "text-gray-400 bg-surface-3 border-gray-700"}`}>
                        #{d.depth_order}
                      </span>
                    </td>
                    <td className="table-cell text-gray-600 text-xs capitalize">{d.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Notes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">My Notes</h2>
          <span className="text-xs text-gray-600">Private · auto-saves</span>
        </div>
        <PlayerNotes
          userId={authUser.id}
          rookieId={rookie.id}
          existingNote={existingNote?.note ?? null}
          noteId={existingNote?.id ?? null}
        />
      </div>
    </div>
  );
}
