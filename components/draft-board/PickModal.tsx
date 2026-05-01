"use client";

import { useState, useMemo } from "react";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import type { DraftBoardPick, DraftBoardRookie, DraftBoardTeam } from "@/lib/mock-data";

interface Props {
  pick: DraftBoardPick;
  availableRookies: DraftBoardRookie[];
  teams: DraftBoardTeam[];
  isOnClock: boolean;
  onConfirm: (pick: DraftBoardPick, rookie: DraftBoardRookie) => void;
  onClose: () => void;
}

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];

export default function PickModal({ pick, availableRookies, teams, isOnClock, onConfirm, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [selected, setSelected] = useState<DraftBoardRookie | null>(null);
  const [confirming, setConfirming] = useState(false);

  const currentTeam = teams.find((t) => t.id === pick.currentTeamId);
  const originalTeam = teams.find((t) => t.id === pick.originalTeamId);

  const filtered = useMemo(() => {
    let list = availableRookies.filter((r) => r.draftStatus === "available");
    if (posFilter !== "All") list = list.filter((r) => r.position === posFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.nflTeam?.toLowerCase().includes(q) ||
          r.college?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableRookies, search, posFilter]);

  function handleSelect(rookie: DraftBoardRookie) {
    setSelected(rookie);
    setConfirming(true);
  }

  function handleBack() {
    setConfirming(false);
    setSelected(null);
  }

  function handleConfirm() {
    if (selected) onConfirm(pick, selected);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-1 rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-gray-100">{pick.label}</span>
              <span className="text-gray-500">·</span>
              <span className="font-medium text-gray-200">
                {currentTeam?.name ?? "Unknown Team"}
              </span>
              {pick.isTraded && originalTeam && (
                <span className="badge text-xs text-orange-300 bg-orange-900/30 border border-orange-700">
                  via {originalTeam.abbreviation}
                </span>
              )}
            </div>
            {!isOnClock && (
              <p className="text-xs text-yellow-400 mt-0.5">
                ⚠ This pick is not on the clock — proceeding will be out of order
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        {confirming && selected ? (
          /* ── Review / Confirm step ── */
          <div className="p-5 flex flex-col gap-5">
            <div>
              <p className="text-sm text-gray-400 mb-3">Confirm this pick?</p>
              <div className="bg-surface-2 rounded-lg border border-gray-700 p-4 flex items-center gap-4">
                <span className={`badge text-sm font-bold px-3 py-1 ${getPositionBadgeClass(selected.position)}`}>
                  {selected.position}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-100 text-lg">{selected.fullName}</p>
                  <p className="text-sm text-gray-400">
                    {selected.nflTeam ?? "FA"} · {selected.college ?? "—"}
                    {selected.nflDraftRound && (
                      <span className="ml-2 text-gray-500">
                        NFL Rd {selected.nflDraftRound} #{selected.nflDraftPick ?? "?"}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="font-mono text-gray-200">{pick.label}</div>
                  <div>{currentTeam?.abbreviation}</div>
                </div>
              </div>
            </div>

            {!isOnClock && (
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3 text-sm text-yellow-300">
                This pick is out of order. The commissioner is authorizing a pick outside the normal draft sequence.
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                ← Back
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1">
                Confirm Pick
              </button>
            </div>
          </div>
        ) : (
          /* ── Player selection step ── */
          <>
            <div className="px-5 py-3 border-b border-gray-800 space-y-2">
              <input
                type="search"
                placeholder="Search player, NFL team, or college…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input text-sm"
                autoFocus
              />
              <div className="flex gap-1 flex-wrap">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosFilter(p)}
                    className={cn(
                      "tab text-xs px-3 py-1",
                      posFilter === p ? "tab-active" : "tab-inactive"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-500 self-center">
                  {filtered.length} available
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">No players match your search.</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {filtered.map((rookie) => (
                      <tr
                        key={rookie.id}
                        onClick={() => handleSelect(rookie)}
                        className="table-row cursor-pointer"
                      >
                        <td className="table-cell w-12">
                          <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
                            {rookie.position}
                          </span>
                        </td>
                        <td className="table-cell">
                          <p className="font-medium text-gray-100">{rookie.fullName}</p>
                          <p className="text-xs text-gray-500">{rookie.college ?? "—"}</p>
                        </td>
                        <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300 min-w-[2rem]">
                            {rookie.nflTeam ?? "FA"}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                          {rookie.nflDraftRound
                            ? `Rd ${rookie.nflDraftRound} #${rookie.nflDraftPick ?? "?"}`
                            : "UDFA"}
                        </td>
                        <td className="table-cell text-right">
                          <span className="text-xs text-brand-light opacity-0 group-hover:opacity-100">
                            Select →
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
