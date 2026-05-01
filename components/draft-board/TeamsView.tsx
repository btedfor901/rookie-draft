"use client";

import { useState } from "react";
import { formatCurrency, getPositionBadgeClass, cn } from "@/lib/utils";
import type { DraftBoardTeam, DraftBoardPick, DraftBoardRookie } from "@/lib/mock-data";

interface Props {
  teams: DraftBoardTeam[];
  picks: DraftBoardPick[];
  rookies: DraftBoardRookie[];
}

export default function TeamsView({ teams, picks, rookies }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rookieMap = new Map(rookies.map((r) => [r.id, r]));

  function getTeamPicks(teamId: string) {
    return picks.filter((p) => p.currentTeamId === teamId).sort((a, b) => a.overallPick - b.overallPick);
  }

  function getTeamDraftedRookies(teamId: string) {
    return rookies.filter((r) => r.draftedByTeamId === teamId);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {teams.length} teams · click a row to expand picks and drafted players
      </p>

      {/* Summary table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left">Team</th>
                <th className="table-header text-right">Bank</th>
                <th className="table-header text-center">Picks</th>
                <th className="table-header text-center">Drafted</th>
                <th className="table-header text-center">Used</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const teamPicks = getTeamPicks(team.id);
                const drafted = getTeamDraftedRookies(team.id);
                const used = teamPicks.filter((p) => p.draftedPlayerId !== null).length;
                const isExpanded = expanded === team.id;

                return (
                  <>
                    <tr
                      key={team.id}
                      onClick={() => setExpanded(isExpanded ? null : team.id)}
                      className={cn(
                        "table-row cursor-pointer",
                        isExpanded && "bg-surface-2"
                      )}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-500 w-8">{team.abbreviation}</span>
                          <span className="font-medium text-gray-100">{team.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right font-medium text-accent-green">
                        {formatCurrency(team.bankCents)}
                      </td>
                      <td className="table-cell text-center text-gray-300">{teamPicks.length}</td>
                      <td className="table-cell text-center text-gray-300">{drafted.length}</td>
                      <td className="table-cell text-center">
                        <span className={cn("text-sm font-medium", used > 0 ? "text-brand-light" : "text-gray-600")}>
                          {used} / {teamPicks.length}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${team.id}-detail`} className="bg-surface-2/50">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Draft Picks */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Draft Picks ({teamPicks.length})
                              </p>
                              {teamPicks.length === 0 ? (
                                <p className="text-xs text-gray-600">No picks owned.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {teamPicks.map((pick) => {
                                    const rookie = pick.draftedPlayerId
                                      ? rookieMap.get(pick.draftedPlayerId)
                                      : null;
                                    return (
                                      <div
                                        key={pick.id}
                                        className={cn(
                                          "text-xs rounded px-2 py-1 border font-mono",
                                          rookie
                                            ? "bg-surface-3 border-gray-600 text-gray-400"
                                            : "bg-brand/10 border-brand/30 text-brand-light"
                                        )}
                                        title={rookie ? `${rookie.fullName}` : "Available"}
                                      >
                                        {pick.label}
                                        {pick.isTraded && (
                                          <span className="text-orange-400 ml-1 text-[10px]">T</span>
                                        )}
                                        {rookie && (
                                          <span className="ml-1 text-gray-500 font-sans not-italic">
                                            — {rookie.fullName.split(" ").at(-1)}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Drafted Rookies */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Rookies Drafted ({drafted.length})
                              </p>
                              {drafted.length === 0 ? (
                                <p className="text-xs text-gray-600">No rookies drafted yet.</p>
                              ) : (
                                <div className="space-y-1">
                                  {drafted.map((rookie) => (
                                    <div key={rookie.id} className="flex items-center gap-2">
                                      <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
                                        {rookie.position}
                                      </span>
                                      <span className="text-sm text-gray-200">{rookie.fullName}</span>
                                      <span className="text-xs text-gray-500">{rookie.nflTeam ?? "FA"}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
