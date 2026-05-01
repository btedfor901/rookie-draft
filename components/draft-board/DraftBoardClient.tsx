"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import QuickNoteModal from "./QuickNoteModal";
import type { RookieWithMeta, CollegeStat } from "@/types/database";

interface Props {
  rookies: RookieWithMeta[];
  userId: string;
  isCommissioner?: boolean;
}

type SortKey = "draft_pick" | "position" | "name" | "nfl_team" | "college";
type SortDir = "asc" | "desc";

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];
const STATUS_FILTERS = ["All", "Available", "Drafted"];

// Returns the single most meaningful stat line for a position from the final season
function getKeyStats(stat: CollegeStat | null, position: string): string {
  if (!stat) return "—";
  if (position === "QB") {
    const pct = stat.pass_completions && stat.pass_attempts
      ? Math.round((stat.pass_completions / stat.pass_attempts) * 100)
      : null;
    const parts = [];
    if (stat.pass_yards) parts.push(`${stat.pass_yards.toLocaleString()} PaYds`);
    if (stat.pass_tds) parts.push(`${stat.pass_tds} TD`);
    if (stat.interceptions !== null) parts.push(`${stat.interceptions} INT`);
    if (pct) parts.push(`${pct}%`);
    return parts.join(" · ") || "—";
  }
  if (position === "RB") {
    const ypc = stat.rush_yards && stat.rush_attempts
      ? (stat.rush_yards / stat.rush_attempts).toFixed(1)
      : null;
    const parts = [];
    if (stat.rush_yards) parts.push(`${stat.rush_yards.toLocaleString()} RuYds`);
    if (stat.rush_tds) parts.push(`${stat.rush_tds} TD`);
    if (ypc) parts.push(`${ypc} YPC`);
    if (stat.receptions) parts.push(`${stat.receptions} rec`);
    return parts.join(" · ") || "—";
  }
  if (position === "WR" || position === "TE") {
    const ypr = stat.receiving_yards && stat.receptions
      ? (stat.receiving_yards / stat.receptions).toFixed(1)
      : null;
    const parts = [];
    if (stat.receptions) parts.push(`${stat.receptions}/${stat.targets ?? "?"} rec`);
    if (stat.receiving_yards) parts.push(`${stat.receiving_yards.toLocaleString()} Yds`);
    if (stat.receiving_tds) parts.push(`${stat.receiving_tds} TD`);
    if (ypr) parts.push(`${ypr} YPR`);
    return parts.join(" · ") || "—";
  }
  return "—";
}

function SortHeader({
  label, sortKey: key, current, dir, onSort
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === key;
  return (
    <th
      className="table-header text-left cursor-pointer select-none hover:text-gray-200 transition-colors"
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn("text-xs", active ? "text-brand-light" : "text-gray-700")}>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}

export default function DraftBoardClient({ rookies: initialRookies, userId, isCommissioner }: Props) {
  const [rookies, setRookies] = useState(initialRookies);

  // Filters
  const [posFilter, setPosFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [nflTeamFilter, setNflTeamFilter] = useState("All");
  const [roundFilter, setRoundFilter] = useState("All");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("draft_pick");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Quick note modal
  const [quickNote, setQuickNote] = useState<{
    rookie: RookieWithMeta;
    noteId: string | null;
    existingNote: string | null;
  } | null>(null);

  // Collect unique NFL teams and rounds for filter dropdowns
  const nflTeams = useMemo(() => {
    const teams = Array.from(new Set(rookies.map((r) => r.nfl_team).filter(Boolean))).sort() as string[];
    return ["All", ...teams];
  }, [rookies]);

  const rounds = useMemo(() => {
    const rs = Array.from(new Set(rookies.map((r) => r.nfl_draft_round).filter(Boolean))).sort((a, b) => (a as number) - (b as number)) as number[];
    return ["All", ...rs.map(String)];
  }, [rookies]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = [...rookies];

    if (posFilter !== "All") list = list.filter((r) => r.position === posFilter);
    if (statusFilter === "Available") list = list.filter((r) => r.draft_status === "available");
    if (statusFilter === "Drafted") list = list.filter((r) => r.draft_status === "drafted");
    if (watchlistOnly) list = list.filter((r) => r.isWatchlisted);
    if (nflTeamFilter !== "All") list = list.filter((r) => r.nfl_team === nflTeamFilter);
    if (roundFilter !== "All") {
      const round = parseInt(roundFilter);
      list = list.filter((r) => r.nfl_draft_round === round);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.college?.toLowerCase().includes(q) ||
          r.nfl_team?.toLowerCase().includes(q) ||
          r.fantasy_outlook?.toLowerCase().includes(q)
      );
    }

    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "draft_pick": {
          const aR = a.nfl_draft_round ?? 99, bR = b.nfl_draft_round ?? 99;
          if (aR !== bR) return (aR - bR) * mult;
          return ((a.nfl_draft_pick ?? 999) - (b.nfl_draft_pick ?? 999)) * mult;
        }
        case "position": return a.position.localeCompare(b.position) * mult;
        case "name": return a.full_name.localeCompare(b.full_name) * mult;
        case "nfl_team": return (a.nfl_team ?? "").localeCompare(b.nfl_team ?? "") * mult;
        case "college": return (a.college ?? "").localeCompare(b.college ?? "") * mult;
        default: return 0;
      }
    });

    return list;
  }, [rookies, posFilter, statusFilter, search, sortKey, sortDir, watchlistOnly, nflTeamFilter, roundFilter]);

  async function toggleWatchlist(rookieId: string, currently: boolean) {
    const supabase = createClient();
    if (currently) {
      await supabase.from("watchlists").delete()
        .eq("user_id", userId).eq("rookie_player_id", rookieId);
    } else {
      await supabase.from("watchlists").insert({ user_id: userId, rookie_player_id: rookieId });
    }
    setRookies((prev) =>
      prev.map((r) => r.id === rookieId ? { ...r, isWatchlisted: !currently } : r)
    );
  }

  function handleNoteSaved(rookieId: string, note: string, noteId: string) {
    setRookies((prev) =>
      prev.map((r) => r.id === rookieId ? { ...r, userNote: note || null } : r)
    );
  }

  const watchlistCount = rookies.filter((r) => r.isWatchlisted).length;
  const availableCount = rookies.filter((r) => r.draft_status === "available").length;

  return (
    <div className="space-y-4">
      {/* Quick note modal */}
      {quickNote && (
        <QuickNoteModal
          userId={userId}
          rookie={quickNote.rookie}
          existingNote={quickNote.existingNote}
          noteId={quickNote.noteId}
          onClose={() => setQuickNote(null)}
          onSaved={(note, id) => { handleNoteSaved(quickNote.rookie.id, note, id); setQuickNote(null); }}
        />
      )}

      {/* Summary strip */}
      <div className="flex gap-4 text-sm text-gray-400">
        <span><strong className="text-gray-100">{rookies.length}</strong> total</span>
        <span>·</span>
        <span><strong className="text-accent-green">{availableCount}</strong> available</span>
        <span>·</span>
        <span><strong className="text-yellow-400">{watchlistCount}</strong> watchlisted</span>
        {filtered.length !== rookies.length && (
          <>
            <span>·</span>
            <span className="text-brand-light">{filtered.length} shown</span>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <input
              type="search"
              placeholder="Search name, college, NFL team, outlook..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-sm"
            />
          </div>

          {/* Position */}
          <div className="flex gap-1 flex-wrap">
            {POSITIONS.map((p) => (
              <button key={p} onClick={() => setPosFilter(p)}
                className={cn("tab text-xs px-3 py-1.5", posFilter === p ? "tab-active" : "tab-inactive")}>
                {p}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("tab text-xs px-3 py-1.5", statusFilter === s ? "tab-active" : "tab-inactive")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Watchlist */}
          <button onClick={() => setWatchlistOnly(!watchlistOnly)}
            className={cn("tab text-xs px-3 py-1.5 flex items-center gap-1.5",
              watchlistOnly ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700" : "tab-inactive")}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Watchlist {watchlistCount > 0 && <span className="font-bold">({watchlistCount})</span>}
          </button>

          {/* NFL Team filter */}
          {nflTeams.length > 2 && (
            <select value={nflTeamFilter} onChange={(e) => setNflTeamFilter(e.target.value)} className="select text-xs w-auto">
              {nflTeams.map((t) => <option key={t} value={t}>{t === "All" ? "All NFL Teams" : t}</option>)}
            </select>
          )}

          {/* Round filter */}
          {rounds.length > 2 && (
            <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)} className="select text-xs w-auto">
              {rounds.map((r) => <option key={r} value={r}>{r === "All" ? "All Rounds" : `Round ${r}`}</option>)}
            </select>
          )}

          {/* Clear filters */}
          {(posFilter !== "All" || statusFilter !== "All" || search || watchlistOnly || nflTeamFilter !== "All" || roundFilter !== "All") && (
            <button
              onClick={() => { setPosFilter("All"); setStatusFilter("All"); setSearch(""); setWatchlistOnly(false); setNflTeamFilter("All"); setRoundFilter("All"); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left w-10">#</th>
                <SortHeader label="Player" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Pos" sortKey="position" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="NFL Team" sortKey="nfl_team" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="College" sortKey="college" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Draft" sortKey="draft_pick" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="table-header text-left">Last Season</th>
                <th className="table-header text-left">Depth</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-center w-10" title="Watchlist">★</th>
                <th className="table-header text-center w-10" title="Notes">✎</th>
                <th className="table-header text-right">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-gray-500 text-sm">
                    No players match your filters.{" "}
                    <button
                      onClick={() => { setPosFilter("All"); setStatusFilter("All"); setSearch(""); setWatchlistOnly(false); setNflTeamFilter("All"); setRoundFilter("All"); }}
                      className="text-brand-light hover:underline"
                    >
                      Clear all
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((rookie, i) => {
                  const keyStats = getKeyStats(rookie.finalCollegeSeason, rookie.position);
                  const hasNote = !!rookie.userNote;
                  const isDepth1 = rookie.depth_chart_position?.endsWith("1");

                  return (
                    <tr key={rookie.id} className="table-row group">
                      <td className="table-cell text-gray-600 text-xs font-mono">{i + 1}</td>

                      {/* Player name */}
                      <td className="table-cell">
                        <div className="font-medium text-gray-100 leading-tight">{rookie.full_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {rookie.isWatchlisted && <span className="text-yellow-500 text-xs">★</span>}
                          {hasNote && <span className="text-brand-light text-xs" title="You have a note">✎</span>}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="table-cell">
                        <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
                          {rookie.position}
                        </span>
                      </td>

                      {/* NFL team */}
                      <td className="table-cell">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300 min-w-[2rem]">
                          {rookie.nfl_team ?? "FA"}
                        </span>
                      </td>

                      {/* College */}
                      <td className="table-cell text-gray-400 text-xs max-w-32 truncate">
                        {rookie.college ?? "—"}
                      </td>

                      {/* Draft capital */}
                      <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                        {rookie.nfl_draft_round
                          ? <span>Rd {rookie.nfl_draft_round} · <span className="text-gray-300">#{rookie.nfl_draft_pick ?? "?"}</span></span>
                          : <span className="text-gray-600">UDFA</span>}
                      </td>

                      {/* Last season stats */}
                      <td className="table-cell text-xs text-gray-400 max-w-48">
                        {rookie.finalCollegeSeason ? (
                          <span title={`${rookie.finalCollegeSeason.season} — ${rookie.finalCollegeSeason.team}`}>
                            <span className="text-gray-600 mr-1">{rookie.finalCollegeSeason.season}</span>
                            {keyStats}
                          </span>
                        ) : (
                          <span className="text-gray-700">No stats</span>
                        )}
                      </td>

                      {/* Depth */}
                      <td className="table-cell text-xs">
                        {rookie.depth_chart_position ? (
                          <span className={cn("badge text-xs border",
                            isDepth1
                              ? "text-accent-green bg-green-900/30 border-green-800"
                              : "text-gray-400 bg-surface-3 border-gray-700")}>
                            {rookie.depth_chart_position}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="table-cell whitespace-nowrap">
                        {rookie.draft_status === "available" ? (
                          <span className="badge text-xs text-accent-green bg-green-900/30 border border-green-800">
                            Available
                          </span>
                        ) : (
                          <div>
                            <span className="badge text-xs text-gray-400 bg-surface-3 border border-gray-700">
                              Drafted
                            </span>
                            {rookie.drafted_by_team && (
                              <div className="text-xs text-gray-600 mt-0.5">
                                {rookie.drafted_by_team.abbreviation}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Watchlist star */}
                      <td className="table-cell text-center">
                        <button
                          onClick={() => toggleWatchlist(rookie.id, rookie.isWatchlisted)}
                          className={cn("transition-colors",
                            rookie.isWatchlisted ? "text-yellow-400 hover:text-yellow-300" : "text-gray-700 hover:text-yellow-400")}
                          title={rookie.isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mx-auto">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      </td>

                      {/* Quick note button */}
                      <td className="table-cell text-center">
                        <button
                          onClick={() => setQuickNote({ rookie, noteId: null, existingNote: rookie.userNote })}
                          className={cn("transition-colors",
                            hasNote ? "text-brand-light hover:text-brand" : "text-gray-700 hover:text-brand-light")}
                          title={hasNote ? "Edit your note" : "Add a note"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mx-auto">
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                          </svg>
                        </button>
                      </td>

                      {/* Profile link */}
                      <td className="table-cell text-right">
                        <Link
                          href={`/dashboard/players/${rookie.id}`}
                          className="text-xs text-brand-light hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Profile →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
