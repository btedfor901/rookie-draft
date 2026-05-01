"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import QuickNoteModal from "@/components/draft-board/QuickNoteModal";

interface Entry {
  watchlistId: string;
  addedAt: string;
  rookie: any;
  finalSeason: any;
  userNote: { note: string; id: string } | null;
  latestDepth: any;
}

interface Props {
  entries: Entry[];
  userId: string;
}

export default function WatchlistPageClient({ entries: initial, userId }: Props) {
  const [entries, setEntries] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState<Entry | null>(null);
  const [sortBy, setSortBy] = useState<"added" | "position" | "name">("added");

  async function handleRemove(watchlistId: string, rookieId: string) {
    setRemoving(rookieId);
    const supabase = createClient();
    await supabase.from("watchlists").delete().eq("id", watchlistId);
    setEntries((prev) => prev.filter((e) => e.watchlistId !== watchlistId));
    setRemoving(null);
  }

  function handleNoteSaved(rookieId: string, note: string, noteId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.rookie.id === rookieId
          ? { ...e, userNote: note ? { note, id: noteId } : null }
          : e
      )
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "added") return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    if (sortBy === "position") return a.rookie.position.localeCompare(b.rookie.position);
    return a.rookie.full_name.localeCompare(b.rookie.full_name);
  });

  if (entries.length === 0) {
    return (
      <div className="card text-center py-20">
        <div className="text-5xl mb-4">⭐</div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Your watchlist is empty</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          Star players on the Draft Board to add them here. Your watchlist is private — only you can see it.
        </p>
        <Link href="/dashboard/draft-board" className="btn-primary inline-flex">
          Go to Draft Board
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick note modal */}
      {quickNote && (
        <QuickNoteModal
          userId={userId}
          rookie={quickNote.rookie}
          existingNote={quickNote.userNote?.note ?? null}
          noteId={quickNote.userNote?.id ?? null}
          onClose={() => setQuickNote(null)}
          onSaved={(note, id) => { handleNoteSaved(quickNote.rookie.id, note, id); setQuickNote(null); }}
        />
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort:</span>
        {(["added", "position", "name"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn("tab text-xs px-3 py-1.5 capitalize", sortBy === s ? "tab-active" : "tab-inactive")}
          >
            {s === "added" ? "Date Added" : s}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((entry) => {
          const { rookie, finalSeason, latestDepth, userNote } = entry;
          const isDepth1 = rookie.depth_chart_position?.endsWith("1");

          return (
            <div
              key={entry.watchlistId}
              className="card flex flex-col gap-3 hover:border-gray-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
                      {rookie.position}
                    </span>
                    {rookie.draft_status !== "available" && (
                      <span className="badge text-xs text-gray-400 bg-surface-3 border border-gray-700">
                        Drafted
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/players/${rookie.id}`}
                    className="font-semibold text-gray-100 hover:text-brand-light transition-colors block truncate"
                  >
                    {rookie.full_name}
                  </Link>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {rookie.nfl_team && <span className="font-semibold text-gray-400">{rookie.nfl_team}</span>}
                    {rookie.college && <span>· {rookie.college}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.watchlistId, rookie.id)}
                  disabled={removing === rookie.id}
                  className="text-yellow-400 hover:text-gray-500 transition-colors flex-shrink-0"
                  title="Remove from watchlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </div>

              {/* Draft capital */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>
                  {rookie.nfl_draft_round
                    ? `Rd ${rookie.nfl_draft_round}, Pick ${rookie.nfl_draft_pick ?? "?"}`
                    : "UDFA"}
                </span>
                {rookie.depth_chart_position && (
                  <span className={cn("badge text-xs border",
                    isDepth1
                      ? "text-accent-green bg-green-900/30 border-green-800"
                      : "text-gray-400 bg-surface-3 border-gray-700")}>
                    {rookie.depth_chart_position}
                  </span>
                )}
              </div>

              {/* Final season key stat */}
              {finalSeason && (
                <div className="bg-surface-2 rounded-lg px-3 py-2 text-xs text-gray-400">
                  <span className="text-gray-600 mr-1">{finalSeason.season}</span>
                  {rookie.position === "QB" && `${finalSeason.pass_yards ?? "—"} PaYds · ${finalSeason.pass_tds ?? "—"} TD`}
                  {rookie.position === "RB" && `${finalSeason.rush_yards ?? "—"} RuYds · ${finalSeason.rush_tds ?? "—"} TD · ${finalSeason.receptions ?? "—"} rec`}
                  {(rookie.position === "WR" || rookie.position === "TE") && `${finalSeason.receptions ?? "—"}/${finalSeason.targets ?? "?"} rec · ${finalSeason.receiving_yards ?? "—"} Yds · ${finalSeason.receiving_tds ?? "—"} TD`}
                </div>
              )}

              {/* Fantasy outlook snippet */}
              {rookie.fantasy_outlook && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                  {rookie.fantasy_outlook}
                </p>
              )}

              {/* User note */}
              {userNote && (
                <div className="bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-300 line-clamp-2">{userNote.note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-1 border-t border-gray-800">
                <button
                  onClick={() => setQuickNote(entry)}
                  className="btn-ghost text-xs flex-1 flex items-center justify-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                  {userNote ? "Edit Note" : "Add Note"}
                </button>
                <Link
                  href={`/dashboard/players/${rookie.id}`}
                  className="btn-secondary text-xs flex-1 text-center"
                >
                  Full Profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
