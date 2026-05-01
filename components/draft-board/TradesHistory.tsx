"use client";

import { getPositionBadgeClass } from "@/lib/utils";
import type { DraftBoardPick, DraftBoardRookie, DraftBoardTeam } from "@/lib/mock-data";

interface Props {
  picks: DraftBoardPick[];
  rookies: DraftBoardRookie[];
  teams: DraftBoardTeam[];
}

export default function TradesHistory({ picks, rookies, teams }: Props) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const rookieMap = new Map(rookies.map((r) => [r.id, r]));

  // Traded picks: current owner ≠ original owner
  const tradedPicks = picks
    .filter((p) => p.isTraded)
    .sort((a, b) => a.overallPick - b.overallPick);

  // Draft history: picks that have been made, sorted by drafted time
  const draftLog = picks
    .filter((p) => p.draftedPlayerId !== null && p.draftedAt !== null)
    .sort((a, b) => new Date(a.draftedAt!).getTime() - new Date(b.draftedAt!).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Traded Picks ── */}
      <div className="space-y-3">
        <h3 className="section-title">Traded Picks</h3>
        {tradedPicks.length === 0 ? (
          <div className="card text-center py-8 text-gray-500 text-sm">
            No traded picks recorded.
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-surface-2">
                  <th className="table-header text-left">Pick</th>
                  <th className="table-header text-left">Original Owner</th>
                  <th className="table-header text-left">Current Owner</th>
                  <th className="table-header text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tradedPicks.map((pick) => {
                  const current = teamMap.get(pick.currentTeamId);
                  const original = teamMap.get(pick.originalTeamId);
                  const rookie = pick.draftedPlayerId ? rookieMap.get(pick.draftedPlayerId) : null;

                  return (
                    <tr key={pick.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono font-bold text-gray-200">{pick.label}</span>
                        <span className="text-xs text-gray-600 ml-1">#{pick.overallPick}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-400">{original?.abbreviation}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm font-medium text-orange-300">{current?.abbreviation}</span>
                      </td>
                      <td className="table-cell">
                        {rookie ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`badge text-[10px] font-bold ${getPositionBadgeClass(rookie.position)}`}>
                              {rookie.position}
                            </span>
                            <span className="text-xs text-gray-300">{rookie.fullName}</span>
                          </div>
                        ) : (
                          <span className="badge text-xs text-accent-green bg-green-900/20 border border-green-900">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Draft Log ── */}
      <div className="space-y-3">
        <h3 className="section-title">Draft Log</h3>
        {draftLog.length === 0 ? (
          <div className="card text-center py-8 text-gray-500 text-sm">
            No picks have been made yet.
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-surface-2 z-10">
                  <tr className="border-b border-gray-800">
                    <th className="table-header text-left">#</th>
                    <th className="table-header text-left">Player</th>
                    <th className="table-header text-left">Team</th>
                    <th className="table-header text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {draftLog.map((pick) => {
                    const rookie = pick.draftedPlayerId ? rookieMap.get(pick.draftedPlayerId) : null;
                    const team = teamMap.get(pick.currentTeamId);
                    const draftedAt = pick.draftedAt ? new Date(pick.draftedAt) : null;

                    return (
                      <tr key={pick.id} className="table-row">
                        <td className="table-cell text-xs">
                          <span className="font-mono font-bold text-gray-300">{pick.label}</span>
                        </td>
                        <td className="table-cell">
                          {rookie ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`badge text-[10px] font-bold px-1 ${getPositionBadgeClass(rookie.position)}`}>
                                {rookie.position}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-100">{rookie.fullName}</p>
                                <p className="text-[11px] text-gray-500">{rookie.nflTeam ?? "FA"}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="table-cell text-xs font-medium text-gray-300">
                          {team?.abbreviation}
                        </td>
                        <td className="table-cell text-xs text-gray-600">
                          {draftedAt
                            ? draftedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
