"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPositionBadgeClass } from "@/lib/utils";
import Papa from "papaparse";
import RookieEditModal from "./RookieEditModal";

interface Props {
  rookies: any[];
  teams: any[];
}

interface CsvPreviewRow {
  first_name: string; last_name: string; position: string;
  nfl_team: string; college: string; nfl_draft_round: string;
  nfl_draft_pick: string; nfl_draft_year: string;
  height: string; weight: string; age: string;
  strengths: string; weaknesses: string; fantasy_outlook: string; team_fit: string;
  depth_chart_position: string;
  _valid: boolean; _error: string;
}

const QUICK_ADD_BLANK = {
  first_name: "", last_name: "", position: "RB",
  nfl_team: "", college: "", nfl_draft_round: "", nfl_draft_pick: "",
  nfl_draft_year: new Date().getFullYear().toString(),
  height: "", weight: "", age: "",
};

export default function RookiesAdminTab({ rookies: initialRookies, teams }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rookies, setRookies] = useState(initialRookies);
  const [editingRookie, setEditingRookie] = useState<any | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Quick-add form
  const [form, setForm] = useState(QUICK_ADD_BLANK);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // CSV preview state
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  function setF(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  // ── Quick-add single rookie ───────────────────────────────────────────────
  async function handleAddRookie() {
    if (!form.first_name || !form.last_name) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("rookie_players").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      position: form.position,
      nfl_team: form.nfl_team.trim() || null,
      college: form.college.trim() || null,
      nfl_draft_round: form.nfl_draft_round ? parseInt(form.nfl_draft_round) : null,
      nfl_draft_pick: form.nfl_draft_pick ? parseInt(form.nfl_draft_pick) : null,
      nfl_draft_year: parseInt(form.nfl_draft_year) || new Date().getFullYear(),
      height: form.height || null,
      weight: form.weight ? parseInt(form.weight) : null,
      age: form.age ? parseInt(form.age) : null,
    });

    if (error) { setMsg({ text: error.message, type: "err" }); }
    else {
      setMsg({ text: `${form.first_name} ${form.last_name} added.`, type: "ok" });
      setForm(QUICK_ADD_BLANK);
      setShowQuickAdd(false);
      router.refresh();
    }
    setSaving(false);
  }

  // ── CSV parse → preview ───────────────────────────────────────────────────
  function handleCSVParse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[]).map((row): CsvPreviewRow => {
          const hasName = row.first_name?.trim() && row.last_name?.trim();
          const hasPos = row.position?.trim();
          return {
            first_name: row.first_name?.trim() ?? "",
            last_name: row.last_name?.trim() ?? "",
            position: (row.position?.trim() ?? "").toUpperCase(),
            nfl_team: row.nfl_team?.trim() ?? "",
            college: row.college?.trim() ?? "",
            nfl_draft_round: row.nfl_draft_round?.trim() ?? "",
            nfl_draft_pick: row.nfl_draft_pick?.trim() ?? "",
            nfl_draft_year: row.nfl_draft_year?.trim() ?? new Date().getFullYear().toString(),
            height: row.height?.trim() ?? "",
            weight: row.weight?.trim() ?? "",
            age: row.age?.trim() ?? "",
            strengths: row.strengths?.trim() ?? "",
            weaknesses: row.weaknesses?.trim() ?? "",
            fantasy_outlook: row.fantasy_outlook?.trim() ?? "",
            team_fit: row.team_fit?.trim() ?? "",
            depth_chart_position: row.depth_chart_position?.trim() ?? "",
            _valid: !!(hasName && hasPos),
            _error: !hasName ? "Missing name" : !hasPos ? "Missing position" : "",
          };
        });
        setCsvPreview(rows);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  }

  async function handleCSVImport() {
    if (!csvPreview) return;
    setImporting(true);
    const supabase = createClient();

    const validRows = csvPreview.filter((r) => r._valid);
    const inserts = validRows.map((row) => ({
      first_name: row.first_name,
      last_name: row.last_name,
      position: row.position,
      nfl_team: row.nfl_team || null,
      college: row.college || null,
      nfl_draft_round: row.nfl_draft_round ? parseInt(row.nfl_draft_round) : null,
      nfl_draft_pick: row.nfl_draft_pick ? parseInt(row.nfl_draft_pick) : null,
      nfl_draft_year: row.nfl_draft_year ? parseInt(row.nfl_draft_year) : new Date().getFullYear(),
      height: row.height || null,
      weight: row.weight ? parseInt(row.weight) : null,
      age: row.age ? parseInt(row.age) : null,
      strengths: row.strengths || null,
      weaknesses: row.weaknesses || null,
      fantasy_outlook: row.fantasy_outlook || null,
      team_fit: row.team_fit || null,
      depth_chart_position: row.depth_chart_position || null,
    }));

    const { error } = await supabase.from("rookie_players").insert(inserts);
    if (error) {
      setMsg({ text: `Import error: ${error.message}`, type: "err" });
    } else {
      setMsg({ text: `Imported ${inserts.length} rookies (${csvPreview.length - inserts.length} skipped).`, type: "ok" });
      setCsvPreview(null);
      router.refresh();
    }
    setImporting(false);
  }

  const filteredRookies = search.trim()
    ? rookies.filter((r) =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.college?.toLowerCase().includes(search.toLowerCase()) ||
        r.nfl_team?.toLowerCase().includes(search.toLowerCase())
      )
    : rookies;

  return (
    <div className="space-y-5">
      {/* Edit modal */}
      {editingRookie && (
        <RookieEditModal
          rookie={editingRookie}
          onClose={() => setEditingRookie(null)}
          onSaved={() => { router.refresh(); setMsg({ text: "Saved.", type: "ok" }); }}
        />
      )}

      {/* Status message */}
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${msg.type === "ok" ? "bg-green-900/30 border-green-800 text-green-300" : "bg-red-900/30 border-red-800 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* ── CSV Import ──────────────────────────────────────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Import Rookies via CSV</h2>
          {csvPreview && (
            <button onClick={() => setCsvPreview(null)} className="btn-ghost text-xs">
              Clear preview
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Required columns: <code className="bg-surface-3 px-1 rounded text-gray-300">first_name, last_name, position</code>
          &nbsp;· Optional: <code className="bg-surface-3 px-1 rounded text-gray-300">nfl_team, college, nfl_draft_round, nfl_draft_pick, nfl_draft_year, height, weight, age, strengths, weaknesses, fantasy_outlook, team_fit, depth_chart_position</code>
        </p>

        {!csvPreview ? (
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <span className="btn-secondary text-xs">Choose CSV file</span>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVParse} className="hidden" />
          </label>
        ) : (
          <div className="space-y-3">
            {/* Preview summary */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">{csvPreview.length} rows parsed</span>
              <span className="text-accent-green">{csvPreview.filter((r) => r._valid).length} valid</span>
              {csvPreview.filter((r) => !r._valid).length > 0 && (
                <span className="text-accent-red">{csvPreview.filter((r) => !r._valid).length} will be skipped</span>
              )}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-lg border border-gray-700 max-h-64">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-2">
                  <tr className="border-b border-gray-700">
                    <th className="table-header text-left py-2">Name</th>
                    <th className="table-header text-left py-2">Pos</th>
                    <th className="table-header text-left py-2">NFL</th>
                    <th className="table-header text-left py-2">College</th>
                    <th className="table-header text-left py-2">Draft</th>
                    <th className="table-header text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-800 ${!row._valid ? "bg-red-900/10" : "hover:bg-surface-2"}`}>
                      <td className="px-3 py-2 text-gray-200">{row.first_name} {row.last_name}</td>
                      <td className="px-3 py-2 text-gray-400">{row.position}</td>
                      <td className="px-3 py-2 text-gray-400">{row.nfl_team || "—"}</td>
                      <td className="px-3 py-2 text-gray-400">{row.college || "—"}</td>
                      <td className="px-3 py-2 text-gray-400">
                        {row.nfl_draft_round ? `R${row.nfl_draft_round}P${row.nfl_draft_pick || "?"}` : "UDFA"}
                      </td>
                      <td className="px-3 py-2">
                        {row._valid
                          ? <span className="text-accent-green">✓</span>
                          : <span className="text-accent-red">{row._error}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCSVImport}
                disabled={importing || csvPreview.filter((r) => r._valid).length === 0}
                className="btn-primary"
              >
                {importing ? "Importing..." : `Import ${csvPreview.filter((r) => r._valid).length} Rookies`}
              </button>
              <button onClick={() => setCsvPreview(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick-add form ──────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Add Single Rookie</h2>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="btn-secondary text-xs"
          >
            {showQuickAdd ? "Collapse" : "Expand form"}
          </button>
        </div>

        {showQuickAdd && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div><label className="label">First Name *</label><input value={form.first_name} onChange={(e) => setF("first_name", e.target.value)} className="input" /></div>
              <div><label className="label">Last Name *</label><input value={form.last_name} onChange={(e) => setF("last_name", e.target.value)} className="input" /></div>
              <div>
                <label className="label">Position *</label>
                <select value={form.position} onChange={(e) => setF("position", e.target.value)} className="select">
                  {["QB","RB","WR","TE","K","DEF","OL","DL","LB","DB"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="label">NFL Team</label><input value={form.nfl_team} onChange={(e) => setF("nfl_team", e.target.value)} className="input" placeholder="KC" maxLength={3} /></div>
              <div><label className="label">College</label><input value={form.college} onChange={(e) => setF("college", e.target.value)} className="input" /></div>
              <div><label className="label">Draft Year</label><input value={form.nfl_draft_year} onChange={(e) => setF("nfl_draft_year", e.target.value)} className="input" /></div>
              <div><label className="label">Draft Round</label><input type="number" min="1" max="7" value={form.nfl_draft_round} onChange={(e) => setF("nfl_draft_round", e.target.value)} className="input" /></div>
              <div><label className="label">Draft Pick</label><input type="number" value={form.nfl_draft_pick} onChange={(e) => setF("nfl_draft_pick", e.target.value)} className="input" /></div>
              <div><label className="label">Height</label><input value={form.height} onChange={(e) => setF("height", e.target.value)} className="input" placeholder={`5'11"`} /></div>
              <div><label className="label">Weight</label><input type="number" value={form.weight} onChange={(e) => setF("weight", e.target.value)} className="input" /></div>
              <div><label className="label">Age</label><input type="number" value={form.age} onChange={(e) => setF("age", e.target.value)} className="input" /></div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={handleAddRookie} disabled={saving || !form.first_name || !form.last_name} className="btn-primary">
                {saving ? "Adding..." : "Add Rookie"}
              </button>
              <button onClick={() => { setForm(QUICK_ADD_BLANK); setShowQuickAdd(false); }} className="btn-ghost text-sm">
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              To add college stats and scouting notes, use the Edit button after creating the player.
            </p>
          </>
        )}
        {!showQuickAdd && (
          <p className="text-xs text-gray-500">
            Expand to manually add a single rookie. For bulk entry, use CSV import above.
          </p>
        )}
      </div>

      {/* ── Rookie pool table ────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between gap-3">
          <h2 className="section-title">
            Rookie Pool
            <span className="ml-2 badge bg-surface-3 text-gray-400 text-xs">{filteredRookies.length}/{rookies.length}</span>
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="input text-sm w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left">Player</th>
                <th className="table-header text-left">Pos</th>
                <th className="table-header text-left">NFL Team</th>
                <th className="table-header text-left">College</th>
                <th className="table-header text-left">Draft</th>
                <th className="table-header text-left">Depth</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRookies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 text-sm">
                    {search ? "No rookies match your search." : "No rookies in pool yet. Import or add above."}
                  </td>
                </tr>
              ) : (
                filteredRookies.map((rookie) => (
                  <tr key={rookie.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-100">{rookie.full_name}</div>
                      {(rookie.college_stats?.length > 0) && (
                        <div className="text-xs text-gray-600">{rookie.college_stats.length} stat season{rookie.college_stats.length > 1 ? "s" : ""}</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${getPositionBadgeClass(rookie.position)}`}>{rookie.position}</span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{rookie.nfl_team ?? "—"}</td>
                    <td className="table-cell text-gray-400 text-xs">{rookie.college ?? "—"}</td>
                    <td className="table-cell text-gray-400 text-xs">
                      {rookie.nfl_draft_round
                        ? `Rd ${rookie.nfl_draft_round}, Pk ${rookie.nfl_draft_pick ?? "?"}`
                        : "UDFA"}
                    </td>
                    <td className="table-cell text-xs text-gray-400">
                      {rookie.depth_chart_position ?? "—"}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs border ${rookie.draft_status === "available"
                        ? "text-accent-green bg-green-900/30 border-green-800"
                        : "text-gray-400 bg-surface-3 border-gray-700"}`}>
                        {rookie.draft_status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => setEditingRookie(rookie)}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        Edit
                      </button>
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
