"use client";

import { getPositionBadgeClass, cn } from "@/lib/utils";
import type { DraftBoardRookie, DraftBoardTeam } from "@/lib/mock-data";
import type { CollegeStatLine } from "@/lib/college-stats";

interface Props {
  rookie: DraftBoardRookie;
  fantasyTeam: DraftBoardTeam | null;
  collegeStats?: CollegeStatLine;
  onClose: () => void;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-3 rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

export default function PlayerStatsModal({ rookie, fantasyTeam, collegeStats, onClose }: Props) {
  const s = collegeStats;
  const pos = rookie.position;

  const statCells: { label: string; value: string | number }[] = [];
  if (s) {
    if (pos === "QB") {
      if (s.passCmp != null && s.passAtt != null) statCells.push({ label: "CMP/ATT", value: `${s.passCmp}/${s.passAtt}` });
      if (s.passPct != null) statCells.push({ label: "CMP%", value: `${s.passPct.toFixed(1)}%` });
      if (s.passYds != null) statCells.push({ label: "Pass YDS", value: s.passYds.toLocaleString() });
      if (s.passTD != null) statCells.push({ label: "Pass TD", value: s.passTD });
      if (s.passInt != null) statCells.push({ label: "INT", value: s.passInt });
      if ((s.rushYds ?? 0) > 0) statCells.push({ label: "Rush YDS", value: (s.rushYds!).toLocaleString() });
      if ((s.rushTD ?? 0) > 0) statCells.push({ label: "Rush TD", value: s.rushTD! });
    } else if (pos === "RB") {
      if (s.rushAtt != null) statCells.push({ label: "CAR", value: s.rushAtt });
      if (s.rushYds != null) statCells.push({ label: "Rush YDS", value: s.rushYds.toLocaleString() });
      if (s.rushTD != null) statCells.push({ label: "Rush TD", value: s.rushTD });
      if (s.rec != null) statCells.push({ label: "REC", value: s.rec });
      if (s.recYds != null) statCells.push({ label: "Rec YDS", value: s.recYds.toLocaleString() });
      if (s.recTD != null) statCells.push({ label: "Rec TD", value: s.recTD });
    } else if (pos === "WR" || pos === "TE") {
      if (s.rec != null) statCells.push({ label: "REC", value: s.rec });
      if (s.recYds != null) statCells.push({ label: "Rec YDS", value: s.recYds.toLocaleString() });
      if (s.recTD != null) statCells.push({ label: "Rec TD", value: s.recTD });
      if ((s.rushYds ?? 0) > 0) statCells.push({ label: "Rush YDS", value: (s.rushYds!).toLocaleString() });
      if ((s.rushTD ?? 0) > 0) statCells.push({ label: "Rush TD", value: s.rushTD! });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface-1 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6 space-y-5 overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
              {rookie.position}
            </span>
            {rookie.nflTeam && (
              <span className="inline-flex items-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300">
                {rookie.nflTeam}
              </span>
            )}
            {rookie.depthChartPosition && (
              <span className={cn(
                "badge text-xs border",
                rookie.depthChartPosition.endsWith("1")
                  ? "text-accent-green bg-green-900/30 border-green-800"
                  : "text-gray-400 bg-surface-3 border-gray-700"
              )}>
                {rookie.depthChartPosition}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-100">{rookie.fullName}</h2>
          {rookie.college && (
            <p className="text-sm text-gray-500 mt-0.5">{rookie.college}</p>
          )}
        </div>

        {/* NFL Draft + Fantasy Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">NFL Draft</div>
            {rookie.nflDraftRound ? (
              <div className="text-sm font-semibold text-gray-200">
                Rd {rookie.nflDraftRound} · <span className="text-white">#{rookie.nflDraftPick}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600">UDFA</div>
            )}
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fantasy Status</div>
            {rookie.draftStatus === "drafted" && fantasyTeam ? (
              <div className="text-sm font-semibold text-gray-400">
                Drafted · <span className="text-gray-200">{fantasyTeam.abbreviation}</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-accent-green">Available</div>
            )}
          </div>
        </div>

        {/* College Stats */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">2025 College Stats</p>
          {statCells.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {statCells.map((cell) => (
                <StatBox key={cell.label} label={cell.label} value={cell.value} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No stats available</p>
          )}
        </div>

        {/* Fantasy Outlook */}
        {rookie.fantasyOutlook && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Fantasy Outlook</p>
            <p className="text-sm text-gray-300 leading-relaxed">{rookie.fantasyOutlook}</p>
          </div>
        )}
      </div>
    </div>
  );
}
