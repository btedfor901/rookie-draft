"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, getPositionBadgeClass } from "@/lib/utils";
import DraftGrid from "./DraftGrid";
import PickModal from "./PickModal";
import PlayerStatsModal from "./PlayerStatsModal";
import TeamsView from "./TeamsView";
import TradesHistory from "./TradesHistory";
import type { DraftBoardTeam, DraftBoardPick, DraftBoardRookie } from "@/lib/mock-data";
import type { CollegeStatLine } from "@/lib/college-stats";

type Tab = "board" | "pool" | "teams" | "trades";

interface Props {
  teams: DraftBoardTeam[];
  initialPicks: DraftBoardPick[];
  initialRookies: DraftBoardRookie[];
  isCommissioner: boolean;
  userId: string;
  isMockMode: boolean;
  collegeStats?: Record<string, CollegeStatLine>;
}

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];
const OFFENSIVE_POSITIONS = ["QB", "RB", "WR", "TE"];
const STATUS_OPTS = ["All", "Available", "Drafted"];

// ── Pool sub-component (inline, works with DraftBoardRookie[]) ────────────────

function RookiePool({ rookies, onPlayerClick }: { rookies: DraftBoardRookie[]; onPlayerClick: (r: DraftBoardRookie) => void }) {
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    let list = rookies.filter((r) => OFFENSIVE_POSITIONS.includes(r.position));
    if (pos !== "All") list = list.filter((r) => r.position === pos);
    if (status === "Available") list = list.filter((r) => r.draftStatus === "available");
    if (status === "Drafted") list = list.filter((r) => r.draftStatus === "drafted");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.nflTeam?.toLowerCase().includes(q) ||
          r.college?.toLowerCase().includes(q)
      );
    }
    // Default sort: available first, then by NFL draft pick
    list.sort((a, b) => {
      if (a.draftStatus !== b.draftStatus) return a.draftStatus === "available" ? -1 : 1;
      const aR = a.nflDraftRound ?? 99, bR = b.nflDraftRound ?? 99;
      if (aR !== bR) return aR - bR;
      return (a.nflDraftPick ?? 999) - (b.nflDraftPick ?? 999);
    });
    return list;
  }, [rookies, search, pos, status]);

  const offensiveRookies = rookies.filter((r) => OFFENSIVE_POSITIONS.includes(r.position));
  const available = offensiveRookies.filter((r) => r.draftStatus === "available").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm text-gray-400">
        <span><strong className="text-gray-100">{offensiveRookies.length}</strong> total</span>
        <span>·</span>
        <span><strong className="text-accent-green">{available}</strong> available</span>
        {filtered.length !== rookies.length && (
          <>
            <span>·</span>
            <span className="text-brand-light">{filtered.length} shown</span>
          </>
        )}
      </div>

      <div className="card space-y-3">
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
              <button key={p} onClick={() => setPos(p)}
                className={cn("tab text-xs px-3 py-1.5", pos === p ? "tab-active" : "tab-inactive")}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {STATUS_OPTS.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn("tab text-xs px-3 py-1.5", status === s ? "tab-active" : "tab-inactive")}>
                {s}
              </button>
            ))}
          </div>
          {(pos !== "All" || status !== "All" || search) && (
            <button
              onClick={() => { setPos("All"); setStatus("All"); setSearch(""); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left w-8">#</th>
                <th className="table-header text-left">Player</th>
                <th className="table-header text-left">Pos</th>
                <th className="table-header text-left">NFL Team</th>
                <th className="table-header text-left">College</th>
                <th className="table-header text-left">NFL Draft</th>
                <th className="table-header text-left">Depth</th>
                <th className="table-header text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 text-sm">
                    No players match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} onClick={() => onPlayerClick(r)} className="table-row cursor-pointer">
                    <td className="table-cell text-gray-600 text-xs font-mono">{i + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-100">{r.fullName}</div>
                      {r.fantasyOutlook && (
                        <div className="text-xs text-gray-600 max-w-xs truncate" title={r.fantasyOutlook}>
                          {r.fantasyOutlook}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs font-bold ${getPositionBadgeClass(r.position)}`}>
                        {r.position}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300 min-w-[2rem]">
                        {r.nflTeam ?? "FA"}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{r.college ?? "—"}</td>
                    <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                      {r.nflDraftRound
                        ? <span>Rd {r.nflDraftRound} · <span className="text-gray-300">#{r.nflDraftPick ?? "?"}</span></span>
                        : <span className="text-gray-600">UDFA</span>}
                    </td>
                    <td className="table-cell text-xs">
                      {r.depthChartPosition ? (
                        <span className={cn("badge text-xs border",
                          r.depthChartPosition.endsWith("1")
                            ? "text-accent-green bg-green-900/30 border-green-800"
                            : "text-gray-400 bg-surface-3 border-gray-700")}>
                          {r.depthChartPosition}
                        </span>
                      ) : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {r.draftStatus === "available" ? (
                        <span className="badge text-xs text-accent-green bg-green-900/30 border border-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="badge text-xs text-gray-400 bg-surface-3 border border-gray-700">
                          Drafted
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main hub ──────────────────────────────────────────────────────────────────

export default function DraftBoardHub({
  teams,
  initialPicks,
  initialRookies,
  isCommissioner,
  userId,
  isMockMode,
  collegeStats = {},
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [picks, setPicks] = useState<DraftBoardPick[]>(initialPicks);
  const [rookies, setRookies] = useState<DraftBoardRookie[]>(initialRookies);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [selectedPick, setSelectedPick] = useState<DraftBoardPick | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<DraftBoardRookie | null>(null);
  const [undoConfirm, setUndoConfirm] = useState(false);

  // Derived
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

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

  const onClockPick =
    sessionActive && !sessionPaused
      ? picks.find((p) => !p.draftedPlayerId) ?? null
      : null;

  const lastDraftedPick = useMemo(() =>
    [...picks]
      .filter((p) => p.draftedPlayerId !== null)
      .sort((a, b) => b.overallPick - a.overallPick)[0] ?? null,
    [picks]
  );

  const pickedCount = picks.filter((p) => p.draftedPlayerId).length;
  const totalPicks = picks.length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleMakePick(pick: DraftBoardPick, rookie: DraftBoardRookie) {
    // Prevent duplicate draft
    if (rookies.find((r) => r.id === rookie.id)?.draftStatus === "drafted") return;

    const now = new Date().toISOString();

    // Update local state immediately
    setPicks((prev) =>
      prev.map((p) =>
        p.id === pick.id ? { ...p, draftedPlayerId: rookie.id, draftedAt: now } : p
      )
    );
    setRookies((prev) =>
      prev.map((r) =>
        r.id === rookie.id
          ? { ...r, draftStatus: "drafted", draftedByTeamId: pick.currentTeamId }
          : r
      )
    );
    setSelectedPick(null);

    // Persist to Supabase when connected
    if (!isMockMode) {
      try {
        const supabase = createClient();
        await Promise.all([
          supabase
            .from("draft_results")
            .insert({
              draft_pick_id: pick.id,
              rookie_player_id: rookie.id,
              fantasy_team_id: pick.currentTeamId,
              overall_pick: pick.overallPick,
            }),
          supabase
            .from("draft_picks")
            .update({ is_used: true })
            .eq("id", pick.id),
          supabase
            .from("rookie_players")
            .update({ draft_status: "drafted", drafted_by_team_id: pick.currentTeamId })
            .eq("id", rookie.id),
        ]);
      } catch {
        // Local state already updated; log silently
      }
    }
  }

  async function handleUndoPick() {
    if (!lastDraftedPick) return;
    const rookieId = lastDraftedPick.draftedPlayerId!;

    setPicks((prev) =>
      prev.map((p) =>
        p.id === lastDraftedPick.id ? { ...p, draftedPlayerId: null, draftedAt: null } : p
      )
    );
    setRookies((prev) =>
      prev.map((r) =>
        r.id === rookieId ? { ...r, draftStatus: "available", draftedByTeamId: null } : r
      )
    );
    setUndoConfirm(false);

    if (!isMockMode) {
      try {
        const supabase = createClient();
        await Promise.all([
          supabase.from("draft_results").delete().eq("draft_pick_id", lastDraftedPick.id),
          supabase.from("draft_picks").update({ is_used: false }).eq("id", lastDraftedPick.id),
          supabase
            .from("rookie_players")
            .update({ draft_status: "available", drafted_by_team_id: null })
            .eq("id", rookieId),
        ]);
      } catch {
        // Already reverted locally
      }
    }
  }

  function handleDraftPlayer(rookie: DraftBoardRookie) {
    if (!isCommissioner || !onClockPick) return;
    handleMakePick(onClockPick, rookie);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "board", label: "Draft Board", badge: `${pickedCount}/${totalPicks}` },
    { id: "pool",  label: "Rookie Pool", badge: String(rookies.filter((r) => OFFENSIVE_POSITIONS.includes(r.position) && r.draftStatus === "available").length) },
    { id: "teams", label: "Teams", badge: String(teams.length) },
    { id: "trades", label: "Trades & History" },
  ];

  return (
    <div className="space-y-4">
      {isMockMode && (
        <div className="bg-blue-950/40 border border-blue-800 rounded-lg px-4 py-2.5 text-sm text-blue-300 flex items-center gap-2">
          <span>ℹ</span>
          <span>Running with sample data — connect Supabase to persist picks and enable real-time updates.</span>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex gap-1 flex-wrap border-b border-gray-800 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "tab px-4 py-2.5 text-sm rounded-b-none border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-brand text-gray-100 bg-surface-2"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-2"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className={cn(
                "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-brand/20 text-brand-light" : "bg-surface-3 text-gray-500"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "board" && (
        <DraftGrid
          picks={picks}
          rookies={rookies}
          teams={teams}
          sessionActive={sessionActive}
          sessionPaused={sessionPaused}
          isCommissioner={isCommissioner}
          collegeStats={collegeStats}
          onDraftPlayer={handleDraftPlayer}
          onPlayerClick={setSelectedPlayer}
          onStartDraft={() => { setSessionActive(true); setSessionPaused(false); }}
          onPauseDraft={() => setSessionPaused((p) => !p)}
          onUndoPick={() => setUndoConfirm(true)}
        />
      )}

      {activeTab === "pool" && <RookiePool rookies={rookies} onPlayerClick={setSelectedPlayer} />}

      {activeTab === "teams" && (
        <TeamsView teams={teams} picks={picks} rookies={rookies} />
      )}

      {activeTab === "trades" && (
        <TradesHistory picks={picks} rookies={rookies} teams={teams} />
      )}

      {/* ── Player stats modal ── */}
      {selectedPlayer && (
        <PlayerStatsModal
          rookie={selectedPlayer}
          fantasyTeam={draftedByMap.get(selectedPlayer.id) ?? null}
          collegeStats={collegeStats[selectedPlayer.id]}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* ── Pick modal ── */}
      {selectedPick && (
        <PickModal
          pick={selectedPick}
          availableRookies={rookies}
          teams={teams}
          isOnClock={onClockPick?.id === selectedPick.id}
          onConfirm={handleMakePick}
          onClose={() => setSelectedPick(null)}
        />
      )}

      {/* ── Undo confirm modal ── */}
      {undoConfirm && lastDraftedPick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setUndoConfirm(false)} />
          <div className="relative bg-surface-1 rounded-xl border border-gray-700 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-gray-100">Undo Last Pick?</h3>
            <p className="text-sm text-gray-400">
              This will revert pick{" "}
              <strong className="font-mono text-gray-200">{lastDraftedPick.label}</strong>.{" "}
              {lastDraftedPick.draftedPlayerId && (
                <>
                  {rookies.find((r) => r.id === lastDraftedPick.draftedPlayerId)?.fullName ?? "The player"} will
                  return to the available pool.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setUndoConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleUndoPick} className="btn-danger flex-1">
                ↩ Undo Pick
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
