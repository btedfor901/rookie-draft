"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPositionBadgeClass } from "@/lib/utils";

interface Props {
  picks: any[];
  results: any[];
  rookies: any[];
  teams: any[];
}

export default function DraftAdminTab({ picks, results, rookies, teams }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Draft a pick
  const [selectedPick, setSelectedPick] = useState("");
  const [selectedRookie, setSelectedRookie] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const availableRookies = rookies.filter((r) => r.draft_status === "available");
  const unusedPicks = picks.filter((p) => !p.is_used);

  const selectedPickData = picks.find((p) => p.id === selectedPick);

  async function handleDraftPick() {
    if (!selectedPick || !selectedRookie) return;
    setSaving(true);
    const supabase = createClient();

    const pick = picks.find((p) => p.id === selectedPick);
    if (!pick) { setSaving(false); return; }

    const overallPick = results.length + 1;

    // Insert draft result
    const { error: resultErr } = await supabase.from("draft_results").insert({
      draft_pick_id: selectedPick,
      rookie_player_id: selectedRookie,
      fantasy_team_id: pick.fantasy_team_id,
      overall_pick: overallPick,
      bid_amount: bidAmount ? Math.round(parseFloat(bidAmount) * 100) : null,
    });

    if (resultErr) { setMsg(`Error: ${resultErr.message}`); setSaving(false); return; }

    // Mark pick as used
    await supabase.from("draft_picks").update({ is_used: true }).eq("id", selectedPick);

    // Mark rookie as drafted
    await supabase.from("rookie_players").update({
      draft_status: "drafted",
      drafted_by_team_id: pick.fantasy_team_id,
    }).eq("id", selectedRookie);

    setMsg(`Pick #${overallPick} recorded.`);
    setSelectedPick("");
    setSelectedRookie("");
    setBidAmount("");
    router.refresh();
    setSaving(false);
  }

  async function handleUndoLastPick() {
    if (results.length === 0) return;
    setSaving(true);
    const supabase = createClient();

    const last = [...results].sort((a, b) => b.overall_pick - a.overall_pick)[0];

    // Delete result
    await supabase.from("draft_results").delete().eq("id", last.id);
    // Restore pick
    if (last.draft_pick_id) {
      await supabase.from("draft_picks").update({ is_used: false }).eq("id", last.draft_pick_id);
    }
    // Restore rookie status
    await supabase.from("rookie_players").update({
      draft_status: "available",
      drafted_by_team_id: null,
    }).eq("id", last.rookie_player_id);

    setMsg(`Undid pick #${last.overall_pick}.`);
    router.refresh();
    setSaving(false);
  }

  async function handleExportCSV() {
    const rows = results.map((r) => ({
      Overall: r.overall_pick,
      Player: r.rookie_player?.full_name ?? "",
      Position: r.rookie_player?.position ?? "",
      NFL_Team: r.rookie_player?.nfl_team ?? "",
      Fantasy_Team: r.fantasy_team?.name ?? "",
      Bid: r.bid_amount ? (r.bid_amount / 100).toFixed(2) : "",
    }));

    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => `"${(row as any)[h]}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "draft_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className="bg-surface-2 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300">
          {msg}
        </div>
      )}

      {/* Make a pick */}
      <div className="card">
        <h2 className="section-title mb-4">Make a Pick</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="label">Draft Pick (Owning Team)</label>
            <select value={selectedPick} onChange={(e) => setSelectedPick(e.target.value)} className="select">
              <option value="">— Select pick —</option>
              {unusedPicks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fantasy_team?.name} — {p.draft_year} Rd {p.draft_round}
                  {p.pick_number ? ` (#${p.pick_number})` : " (TBD)"}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="label">Rookie Player</label>
            <select value={selectedRookie} onChange={(e) => setSelectedRookie(e.target.value)} className="select">
              <option value="">— Select rookie —</option>
              {availableRookies.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} ({r.position}, {r.nfl_team ?? "FA"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bid Amount (optional, $)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="input"
              placeholder="25.00"
            />
          </div>
          {selectedPickData && (
            <div className="lg:col-span-3 bg-surface-2 rounded-lg px-4 py-3 text-sm text-gray-300">
              Drafting for: <strong className="text-gray-100">{selectedPickData.fantasy_team?.name}</strong>
              {" · "}{selectedPickData.draft_year} Round {selectedPickData.draft_round}
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDraftPick}
            disabled={saving || !selectedPick || !selectedRookie}
            className="btn-primary"
          >
            Confirm Pick #{results.length + 1}
          </button>
          {results.length > 0 && (
            <button onClick={handleUndoLastPick} disabled={saving} className="btn-danger">
              Undo Last Pick
            </button>
          )}
        </div>
      </div>

      {/* Draft results */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="section-title">Draft Results ({results.length} picks)</h2>
          {results.length > 0 && (
            <button onClick={handleExportCSV} className="btn-secondary text-xs">
              Export CSV
            </button>
          )}
        </div>
        {results.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">No picks made yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-surface-2">
                  <th className="table-header text-left w-12">Pick</th>
                  <th className="table-header text-left">Player</th>
                  <th className="table-header text-left">Pos</th>
                  <th className="table-header text-left">NFL Team</th>
                  <th className="table-header text-left">Drafted By</th>
                  <th className="table-header text-right">Bid</th>
                </tr>
              </thead>
              <tbody>
                {[...results]
                  .sort((a, b) => a.overall_pick - b.overall_pick)
                  .map((result) => (
                    <tr key={result.id} className="table-row">
                      <td className="table-cell font-mono text-gray-400">{result.overall_pick}</td>
                      <td className="table-cell font-medium text-gray-100">
                        {result.rookie_player?.full_name ?? "—"}
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${getPositionBadgeClass(result.rookie_player?.position ?? "")}`}>
                          {result.rookie_player?.position ?? "—"}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400 text-xs">{result.rookie_player?.nfl_team ?? "—"}</td>
                      <td className="table-cell text-gray-300">{result.fantasy_team?.name ?? "—"}</td>
                      <td className="table-cell text-right font-mono text-accent-yellow">
                        {result.bid_amount ? `$${(result.bid_amount / 100).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pick order */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-gray-800">
          <h2 className="section-title">Available Picks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left">Team</th>
                <th className="table-header text-left">Year</th>
                <th className="table-header text-left">Round</th>
                <th className="table-header text-left">Pick #</th>
                <th className="table-header text-left">Original Team</th>
              </tr>
            </thead>
            <tbody>
              {unusedPicks.map((pick) => (
                <tr key={pick.id} className="table-row">
                  <td className="table-cell font-medium text-gray-100">{pick.fantasy_team?.name ?? "—"}</td>
                  <td className="table-cell text-gray-400">{pick.draft_year}</td>
                  <td className="table-cell text-gray-400">{pick.draft_round}</td>
                  <td className="table-cell text-gray-400">{pick.pick_number ?? "TBD"}</td>
                  <td className="table-cell text-gray-500 text-xs">
                    {pick.original_team?.name === pick.fantasy_team?.name
                      ? "—"
                      : pick.original_team?.name}
                  </td>
                </tr>
              ))}
              {unusedPicks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    All picks have been used.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
