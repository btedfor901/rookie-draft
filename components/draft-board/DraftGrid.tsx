"use client";

import { useState, useMemo } from "react";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import type { DraftBoardPick, DraftBoardRookie, DraftBoardTeam } from "@/lib/mock-data";
import type { CollegeStatLine } from "@/lib/college-stats";
import { formatStatLine } from "@/lib/college-stats";

interface Props {
  picks: DraftBoardPick[];
  rookies: DraftBoardRookie[];
  teams: DraftBoardTeam[];
  sessionActive: boolean;
  sessionPaused: boolean;
  isCommissioner: boolean;
  collegeStats?: Record<string, CollegeStatLine>;
  onDraftPlayer: (rookie: DraftBoardRookie) => void;
  onPlayerClick: (rookie: DraftBoardRookie) => void;
  onStartDraft: () => void;
  onPauseDraft: () => void;
  onUndoPick: () => void;
}

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];
const OFFENSIVE_POSITIONS = ["QB", "RB", "WR", "TE"];

export default function DraftGrid({
  picks,
  rookies,
  teams,
  sessionActive,
  sessionPaused,
  isCommissioner,
  collegeStats = {},
  onDraftPlayer,
  onPlayerClick,
  onStartDraft,
  onPauseDraft,
  onUndoPick,
}: Props) {
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState("All");
  const [showDrafted, setShowDrafted] = useState(true);

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const onClockPick = sessionActive && !sessionPaused
    ? picks.find((p) => !p.draftedPlayerId) ?? null
    : null;

  const pickedCount = picks.filter((p) => p.draftedPlayerId).length;
  const totalPicks = picks.length;

  const lastDraftedPick = [...picks]
    .filter((p) => p.draftedPlayerId !== null)
    .sort((a, b) => b.overallPick - a.overallPick)[0] ?? null;

  // Build a map: rookieId → fantasy team that drafted them
  const draftedByMap = useMemo(() => {
    const map = new Map<string, DraftBoardTeam>();
    for (const pick of picks) {
      if (pick.draftedPlayerId) {
        const team = teamMap.get(pick.currentTeamId);
        if (team) map.set(pick.draftedPlayerId, team);
      }
    }
    return map;
  }, [picks, teamMap]);

  const filtered = useMemo(() => {
    let list = rookies.filter((r) => OFFENSIVE_POSITIONS.includes(r.position));
    if (!showDrafted) list = list.filter((r) => r.draftStatus === "available");
    if (pos !== "All") list = list.filter((r) => r.position === pos);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.nflTeam?.toLowerCase().includes(q) ||
          r.college?.toLowerCase().includes(q)
      );
    }
    // Sort by NFL draft pick (overall rank)
    list.sort((a, b) => {
      const aSlot = (a.nflDraftRound ?? 99) * 1000 + (a.nflDraftPick ?? 999);
      const bSlot = (b.nflDraftRound ?? 99) * 1000 + (b.nflDraftPick ?? 999);
      return aSlot - bSlot;
    });
    return list;
  }, [rookies, pos, search, showDrafted]);

  const canDraft = isCommissioner && sessionActive && !sessionPaused && !!onClockPick;

  return (
    <div className="space-y-4">
      {/* ── Session controls ── */}
      <div className="card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          {sessionActive && !sessionPaused ? (
            <span className="badge text-xs text-accent-green bg-green-900/30 border border-green-800 animate-pulse">
              ● LIVE
            </span>
          ) : sessionActive && sessionPaused ? (
            <span className="badge text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-800">
              ⏸ PAUSED
            </span>
          ) : (
            <span className="badge text-xs text-gray-500 bg-surface-3 border border-gray-700">
              NOT STARTED
            </span>
          )}
          <span className="text-sm text-gray-400">
            {pickedCount} / {totalPicks} picks made
          </span>
          {onClockPick && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-sm text-amber-300 font-medium">
                {teamMap.get(onClockPick.currentTeamId)?.name ?? "—"} on the clock
                <span className="font-mono ml-1 text-amber-400">({onClockPick.label})</span>
              </span>
            </>
          )}
        </div>

        {isCommissioner && (
          <div className="flex gap-2 flex-wrap">
            {!sessionActive ? (
              <button onClick={onStartDraft} className="btn-primary text-sm">
                ▶ Start Draft
              </button>
            ) : (
              <button onClick={onPauseDraft} className="btn-secondary text-sm">
                {sessionPaused ? "▶ Resume" : "⏸ Pause"}
              </button>
            )}
            {lastDraftedPick && (
              <button onClick={onUndoPick} className="btn-danger text-sm">
                ↩ Undo
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── On the clock banner ── */}
      {onClockPick && (
        <div className="bg-amber-950/40 border border-amber-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-amber-500 uppercase tracking-wide font-semibold mb-0.5">On the Clock</p>
            <p className="text-xl font-bold text-amber-300">
              {teamMap.get(onClockPick.currentTeamId)?.name ?? "—"}
            </p>
            {onClockPick.isTraded && (
              <p className="text-xs text-orange-400 mt-0.5">
                traded from {teamMap.get(onClockPick.originalTeamId)?.abbreviation}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-bold text-amber-400">{onClockPick.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Overall #{onClockPick.overallPick}</p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-48">
          <input
            type="search"
            placeholder="Search player, NFL team, college…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPos(p)}
              className={cn("tab text-xs px-3 py-1.5", pos === p ? "tab-active" : "tab-inactive")}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowDrafted((v) => !v)}
          className={cn("tab text-xs px-3 py-1.5", !showDrafted ? "tab-active" : "tab-inactive")}
        >
          Available Only
        </button>
        {(pos !== "All" || search || !showDrafted) && (
          <button
            onClick={() => { setPos("All"); setSearch(""); setShowDrafted(true); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-600 ml-auto">{filtered.length} players</span>
      </div>

      {/* ── Player rankings table ── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-center w-10">Rank</th>
                <th className="table-header text-left">Player</th>
                <th className="table-header text-center">Pos</th>
                <th className="table-header text-center">NFL Team</th>
                <th className="table-header text-left">College</th>
                <th className="table-header text-center">NFL Draft</th>
                <th className="table-header text-left">2025 College Stats</th>
                <th className="table-header text-left">Fantasy Status</th>
                {isCommissioner && (
                  <th className="table-header text-center w-24">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isCommissioner ? 9 : 8} className="text-center py-16 text-gray-500 text-sm">
                    No players match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const fantasyTeam = draftedByMap.get(r.id) ?? null;
                  const isDrafted = r.draftStatus === "drafted";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onPlayerClick(r)}
                      className={cn(
                        "border-b border-gray-800/60 transition-colors cursor-pointer",
                        isDrafted ? "opacity-50 hover:bg-surface-2/50" : "hover:bg-surface-2"
                      )}
                    >
                      {/* Rank */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono text-sm font-bold text-gray-400">{i + 1}</span>
                      </td>

                      {/* Player */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-100 text-sm">{r.fullName}</div>
                        {r.college && (
                          <div className="text-xs text-gray-500 mt-0.5">{r.college}</div>
                        )}
                        {r.fantasyOutlook && (
                          <div className="text-xs text-gray-600 max-w-xs truncate mt-0.5" title={r.fantasyOutlook}>
                            {r.fantasyOutlook}
                          </div>
                        )}
                      </td>

                      {/* Position */}
                      <td className="px-3 py-3 text-center">
                        <span className={`badge text-xs font-bold ${getPositionBadgeClass(r.position)}`}>
                          {r.position}
                        </span>
                      </td>

                      {/* NFL Team */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300 min-w-[2.5rem]">
                          {r.nflTeam ?? "FA"}
                        </span>
                      </td>

                      {/* College */}
                      <td className="px-3 py-3 text-xs text-gray-400">
                        {r.college ?? "—"}
                      </td>

                      {/* NFL Draft slot */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {r.nflDraftRound ? (
                          <div className="text-xs">
                            <span className="text-gray-400">Rd {r.nflDraftRound}</span>
                            <span className="text-gray-600 mx-0.5">·</span>
                            <span className="text-gray-200 font-semibold">#{r.nflDraftPick}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">UDFA</span>
                        )}
                      </td>

                      {/* 2025 College Stats */}
                      <td className="px-3 py-3">
                        {(() => {
                          const s = collegeStats[r.id];
                          if (!s) return <span className="text-xs text-gray-700">—</span>;
                          const line = formatStatLine(r.position, s);
                          if (!line) return <span className="text-xs text-gray-700">—</span>;
                          // For QBs also show rushing if notable
                          const rushLine =
                            r.position === "QB" && (s.rushYds ?? 0) > 100
                              ? `${(s.rushYds ?? 0).toLocaleString()} rush YDS`
                              : null;
                          return (
                            <div className="text-xs text-gray-300 space-y-0.5">
                              <div>{line}</div>
                              {rushLine && <div className="text-gray-500">{rushLine}</div>}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Fantasy status */}
                      <td className="px-3 py-3">
                        {isDrafted && fantasyTeam ? (
                          <span className="text-xs text-gray-400">
                            Drafted by{" "}
                            <span className="font-semibold text-gray-300">{fantasyTeam.abbreviation}</span>
                          </span>
                        ) : (
                          <span className="badge text-xs text-accent-green bg-green-900/30 border border-green-800">
                            Available
                          </span>
                        )}
                      </td>

                      {/* Action (commissioner only) */}
                      {isCommissioner && (
                        <td className="px-3 py-3 text-center">
                          {!isDrafted && canDraft && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDraftPlayer(r); }}
                              className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md font-medium transition-colors"
                            >
                              Draft
                            </button>
                          )}
                        </td>
                      )}
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
