"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ModalTab = "bio" | "scouting" | "stats" | "depth";

interface CollegeStatRow {
  id?: string;
  season: string;
  team: string;
  games: string;
  pass_completions: string; pass_attempts: string; pass_yards: string;
  pass_tds: string; interceptions: string;
  rush_attempts: string; rush_yards: string; rush_tds: string;
  receptions: string; receiving_yards: string; receiving_tds: string; targets: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface DepthRow {
  id?: string;
  nfl_team: string;
  position: string;
  depth_order: string;
  snapshot_date: string;
  source: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface Props {
  rookie: any;
  onClose: () => void;
  onSaved: () => void;
}

const BLANK_STAT: CollegeStatRow = {
  season: "", team: "", games: "",
  pass_completions: "", pass_attempts: "", pass_yards: "", pass_tds: "", interceptions: "",
  rush_attempts: "", rush_yards: "", rush_tds: "",
  receptions: "", receiving_yards: "", receiving_tds: "", targets: "",
  isNew: true,
};

const BLANK_DEPTH: DepthRow = {
  nfl_team: "", position: "", depth_order: "1",
  snapshot_date: new Date().toISOString().slice(0, 10),
  source: "manual", isNew: true,
};

export default function RookieEditModal({ rookie, onClose, onSaved }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<ModalTab>("bio");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // ── Bio fields ────────────────────────────────────────────────────────────
  const [bio, setBio] = useState({
    first_name: rookie.first_name ?? "",
    last_name: rookie.last_name ?? "",
    position: rookie.position ?? "QB",
    nfl_team: rookie.nfl_team ?? "",
    college: rookie.college ?? "",
    nfl_draft_round: rookie.nfl_draft_round?.toString() ?? "",
    nfl_draft_pick: rookie.nfl_draft_pick?.toString() ?? "",
    nfl_draft_year: rookie.nfl_draft_year?.toString() ?? new Date().getFullYear().toString(),
    height: rookie.height ?? "",
    weight: rookie.weight?.toString() ?? "",
    age: rookie.age?.toString() ?? "",
  });

  // ── Scouting fields ───────────────────────────────────────────────────────
  const [scouting, setScouting] = useState({
    depth_chart_position: rookie.depth_chart_position ?? "",
    strengths: rookie.strengths ?? "",
    weaknesses: rookie.weaknesses ?? "",
    fantasy_outlook: rookie.fantasy_outlook ?? "",
    team_fit: rookie.team_fit ?? "",
  });

  // ── College stats ─────────────────────────────────────────────────────────
  const [stats, setStats] = useState<CollegeStatRow[]>(
    (rookie.college_stats ?? []).map((s: any) => ({
      id: s.id,
      season: s.season?.toString() ?? "",
      team: s.team ?? "",
      games: s.games?.toString() ?? "",
      pass_completions: s.pass_completions?.toString() ?? "",
      pass_attempts: s.pass_attempts?.toString() ?? "",
      pass_yards: s.pass_yards?.toString() ?? "",
      pass_tds: s.pass_tds?.toString() ?? "",
      interceptions: s.interceptions?.toString() ?? "",
      rush_attempts: s.rush_attempts?.toString() ?? "",
      rush_yards: s.rush_yards?.toString() ?? "",
      rush_tds: s.rush_tds?.toString() ?? "",
      receptions: s.receptions?.toString() ?? "",
      receiving_yards: s.receiving_yards?.toString() ?? "",
      receiving_tds: s.receiving_tds?.toString() ?? "",
      targets: s.targets?.toString() ?? "",
    }))
  );

  // ── Depth chart ───────────────────────────────────────────────────────────
  const [depths, setDepths] = useState<DepthRow[]>(
    (rookie.depth_chart_snapshots ?? []).map((d: any) => ({
      id: d.id,
      nfl_team: d.nfl_team ?? "",
      position: d.position ?? "",
      depth_order: d.depth_order?.toString() ?? "1",
      snapshot_date: d.snapshot_date ?? "",
      source: d.source ?? "manual",
    }))
  );

  function setBioField(k: string, v: string) { setBio((p) => ({ ...p, [k]: v })); }
  function setScoutingField(k: string, v: string) { setScouting((p) => ({ ...p, [k]: v })); }

  // ── Save bio + scouting ───────────────────────────────────────────────────
  async function saveBioAndScouting() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("rookie_players")
      .update({
        first_name: bio.first_name,
        last_name: bio.last_name,
        position: bio.position,
        nfl_team: bio.nfl_team || null,
        college: bio.college || null,
        nfl_draft_round: bio.nfl_draft_round ? parseInt(bio.nfl_draft_round) : null,
        nfl_draft_pick: bio.nfl_draft_pick ? parseInt(bio.nfl_draft_pick) : null,
        nfl_draft_year: parseInt(bio.nfl_draft_year),
        height: bio.height || null,
        weight: bio.weight ? parseInt(bio.weight) : null,
        age: bio.age ? parseInt(bio.age) : null,
        depth_chart_position: scouting.depth_chart_position || null,
        strengths: scouting.strengths || null,
        weaknesses: scouting.weaknesses || null,
        fantasy_outlook: scouting.fantasy_outlook || null,
        team_fit: scouting.team_fit || null,
      })
      .eq("id", rookie.id);

    setSaving(false);
    if (error) { setMsg({ text: error.message, type: "err" }); return; }
    setMsg({ text: "Saved.", type: "ok" });
    onSaved();
  }

  // ── Save college stats ────────────────────────────────────────────────────
  async function saveCollegeStats() {
    setSaving(true);
    const supabase = createClient();

    const toDelete = stats.filter((s) => s.isDeleted && s.id);
    const toInsert = stats.filter((s) => s.isNew && !s.isDeleted && s.season);
    const toUpdate = stats.filter((s) => !s.isNew && !s.isDeleted && s.id);

    for (const s of toDelete) {
      await supabase.from("college_stats").delete().eq("id", s.id!);
    }

    function mapStat(s: CollegeStatRow) {
      return {
        rookie_player_id: rookie.id,
        season: parseInt(s.season),
        team: s.team,
        games: s.games ? parseInt(s.games) : null,
        pass_completions: s.pass_completions ? parseInt(s.pass_completions) : null,
        pass_attempts: s.pass_attempts ? parseInt(s.pass_attempts) : null,
        pass_yards: s.pass_yards ? parseInt(s.pass_yards) : null,
        pass_tds: s.pass_tds ? parseInt(s.pass_tds) : null,
        interceptions: s.interceptions ? parseInt(s.interceptions) : null,
        rush_attempts: s.rush_attempts ? parseInt(s.rush_attempts) : null,
        rush_yards: s.rush_yards ? parseInt(s.rush_yards) : null,
        rush_tds: s.rush_tds ? parseInt(s.rush_tds) : null,
        receptions: s.receptions ? parseInt(s.receptions) : null,
        receiving_yards: s.receiving_yards ? parseInt(s.receiving_yards) : null,
        receiving_tds: s.receiving_tds ? parseInt(s.receiving_tds) : null,
        targets: s.targets ? parseInt(s.targets) : null,
      };
    }

    if (toInsert.length) {
      const { error } = await supabase.from("college_stats").insert(toInsert.map(mapStat));
      if (error) { setMsg({ text: error.message, type: "err" }); setSaving(false); return; }
    }

    for (const s of toUpdate) {
      await supabase.from("college_stats").update(mapStat(s)).eq("id", s.id!);
    }

    setSaving(false);
    setMsg({ text: "College stats saved.", type: "ok" });
    onSaved();
  }

  // ── Save depth chart ──────────────────────────────────────────────────────
  async function saveDepthChart() {
    setSaving(true);
    const supabase = createClient();

    const toDelete = depths.filter((d) => d.isDeleted && d.id);
    const toInsert = depths.filter((d) => d.isNew && !d.isDeleted && d.nfl_team);
    const toUpdate = depths.filter((d) => !d.isNew && !d.isDeleted && d.id);

    for (const d of toDelete) {
      await supabase.from("depth_chart_snapshots").delete().eq("id", d.id!);
    }

    function mapDepth(d: DepthRow) {
      return {
        rookie_player_id: rookie.id,
        nfl_team: d.nfl_team,
        position: d.position,
        depth_order: parseInt(d.depth_order),
        snapshot_date: d.snapshot_date,
        source: d.source || "manual",
      };
    }

    if (toInsert.length) {
      await supabase.from("depth_chart_snapshots").insert(toInsert.map(mapDepth));
    }
    for (const d of toUpdate) {
      await supabase.from("depth_chart_snapshots").update(mapDepth(d)).eq("id", d.id!);
    }

    setSaving(false);
    setMsg({ text: "Depth chart saved.", type: "ok" });
    onSaved();
  }

  // ── Delete rookie ─────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm(`Delete ${rookie.full_name}? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("rookie_players").delete().eq("id", rookie.id);
    router.refresh();
    onClose();
  }

  const visibleStats = stats.filter((s) => !s.isDeleted);
  const visibleDepths = depths.filter((d) => !d.isDeleted);
  const isQB = bio.position === "QB";
  const isRB = bio.position === "RB";
  const isWRTE = bio.position === "WR" || bio.position === "TE";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-1 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-100">
              {rookie.full_name}
            </h2>
            <p className="text-sm text-gray-400">{rookie.position} · Edit Rookie Profile</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger text-xs px-3 py-1.5"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button onClick={onClose} className="btn-ghost p-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 flex-shrink-0">
          {(["bio", "scouting", "stats", "depth"] as ModalTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(null); }}
              className={cn(
                "tab text-sm capitalize px-4 py-2",
                tab === t ? "tab-active" : "tab-inactive"
              )}
            >
              {t === "stats" ? "College Stats" : t === "depth" ? "Depth Chart" : t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "stats" && visibleStats.length > 0 && (
                <span className="ml-1.5 badge bg-surface-3 text-gray-400 text-xs px-1.5">{visibleStats.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {msg && (
            <div className={cn(
              "mb-4 px-4 py-3 rounded-lg text-sm border",
              msg.type === "ok"
                ? "bg-green-900/30 border-green-800 text-green-300"
                : "bg-red-900/30 border-red-800 text-red-300"
            )}>
              {msg.text}
            </div>
          )}

          {/* ── BIO ─────────────────────────────────────────────────────── */}
          {tab === "bio" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><label className="label">First Name *</label>
                <input value={bio.first_name} onChange={(e) => setBioField("first_name", e.target.value)} className="input" />
              </div>
              <div><label className="label">Last Name *</label>
                <input value={bio.last_name} onChange={(e) => setBioField("last_name", e.target.value)} className="input" />
              </div>
              <div><label className="label">Position *</label>
                <select value={bio.position} onChange={(e) => setBioField("position", e.target.value)} className="select">
                  {["QB","RB","WR","TE","K","DEF","OL","DL","LB","DB"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="label">NFL Team</label>
                <input value={bio.nfl_team} onChange={(e) => setBioField("nfl_team", e.target.value)} className="input" placeholder="LV" maxLength={3} />
              </div>
              <div><label className="label">College</label>
                <input value={bio.college} onChange={(e) => setBioField("college", e.target.value)} className="input" placeholder="Boise State" />
              </div>
              <div><label className="label">Draft Year</label>
                <input type="number" value={bio.nfl_draft_year} onChange={(e) => setBioField("nfl_draft_year", e.target.value)} className="input" />
              </div>
              <div><label className="label">Draft Round</label>
                <input type="number" min="1" max="7" value={bio.nfl_draft_round} onChange={(e) => setBioField("nfl_draft_round", e.target.value)} className="input" placeholder="1–7 or blank for UDFA" />
              </div>
              <div><label className="label">Draft Pick</label>
                <input type="number" value={bio.nfl_draft_pick} onChange={(e) => setBioField("nfl_draft_pick", e.target.value)} className="input" />
              </div>
              <div><label className="label">Age</label>
                <input type="number" value={bio.age} onChange={(e) => setBioField("age", e.target.value)} className="input" />
              </div>
              <div><label className="label">Height</label>
                <input value={bio.height} onChange={(e) => setBioField("height", e.target.value)} className="input" placeholder={`5'11"`} />
              </div>
              <div><label className="label">Weight (lbs)</label>
                <input type="number" value={bio.weight} onChange={(e) => setBioField("weight", e.target.value)} className="input" />
              </div>
            </div>
          )}

          {/* ── SCOUTING ─────────────────────────────────────────────────── */}
          {tab === "scouting" && (
            <div className="space-y-4">
              <div><label className="label">Depth Chart Position</label>
                <input value={scouting.depth_chart_position} onChange={(e) => setScoutingField("depth_chart_position", e.target.value)} className="input" placeholder="RB1, QB2, WR3..." />
              </div>
              <div><label className="label">Fantasy Outlook</label>
                <textarea rows={4} value={scouting.fantasy_outlook} onChange={(e) => setScoutingField("fantasy_outlook", e.target.value)} className="input resize-y" placeholder="Dynasty outlook, target bid, timeline..." />
              </div>
              <div><label className="label">Team Fit</label>
                <textarea rows={3} value={scouting.team_fit} onChange={(e) => setScoutingField("team_fit", e.target.value)} className="input resize-y" placeholder="How the NFL landing spot affects dynasty value..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Strengths</label>
                  <textarea rows={4} value={scouting.strengths} onChange={(e) => setScoutingField("strengths", e.target.value)} className="input resize-y" placeholder="Elite athleticism, route running precision..." />
                </div>
                <div><label className="label">Weaknesses</label>
                  <textarea rows={4} value={scouting.weaknesses} onChange={(e) => setScoutingField("weaknesses", e.target.value)} className="input resize-y" placeholder="Pass protection, contested catch rate..." />
                </div>
              </div>
            </div>
          )}

          {/* ── COLLEGE STATS ─────────────────────────────────────────────── */}
          {tab === "stats" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Enter one row per college season. Leave stat cells blank if not applicable.
                </p>
                <button
                  onClick={() => setStats((p) => [...p, { ...BLANK_STAT }])}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  + Add Season
                </button>
              </div>

              {visibleStats.length === 0 && (
                <p className="text-center text-gray-600 py-8 text-sm">No seasons yet — click Add Season.</p>
              )}

              {visibleStats.map((stat, idx) => {
                const realIdx = stats.indexOf(stat);
                function updateStat(k: string, v: string) {
                  setStats((prev) => prev.map((s, i) => i === realIdx ? { ...s, [k]: v } : s));
                }
                return (
                  <div key={idx} className="bg-surface-2 rounded-xl border border-gray-700 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3">
                        <div className="w-24">
                          <label className="label">Season</label>
                          <input type="number" value={stat.season} onChange={(e) => updateStat("season", e.target.value)} className="input text-sm" placeholder="2024" />
                        </div>
                        <div className="flex-1 min-w-32">
                          <label className="label">College</label>
                          <input value={stat.team} onChange={(e) => updateStat("team", e.target.value)} className="input text-sm" placeholder="Boise State" />
                        </div>
                        <div className="w-20">
                          <label className="label">Games</label>
                          <input type="number" value={stat.games} onChange={(e) => updateStat("games", e.target.value)} className="input text-sm" />
                        </div>
                      </div>
                      <button
                        onClick={() => setStats((prev) => prev.map((s, i) => i === realIdx ? { ...s, isDeleted: true } : s))}
                        className="text-gray-600 hover:text-accent-red transition-colors ml-3"
                        title="Remove season"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 text-xs">
                      {(isQB || isRB) && <>
                        <div><label className="label text-xs">Rush Att</label><input type="number" value={stat.rush_attempts} onChange={(e) => updateStat("rush_attempts", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Rush Yds</label><input type="number" value={stat.rush_yards} onChange={(e) => updateStat("rush_yards", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Rush TD</label><input type="number" value={stat.rush_tds} onChange={(e) => updateStat("rush_tds", e.target.value)} className="input text-xs py-1" /></div>
                      </>}
                      {isQB && <>
                        <div><label className="label text-xs">CMP</label><input type="number" value={stat.pass_completions} onChange={(e) => updateStat("pass_completions", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">ATT</label><input type="number" value={stat.pass_attempts} onChange={(e) => updateStat("pass_attempts", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Pass Yds</label><input type="number" value={stat.pass_yards} onChange={(e) => updateStat("pass_yards", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Pass TD</label><input type="number" value={stat.pass_tds} onChange={(e) => updateStat("pass_tds", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">INT</label><input type="number" value={stat.interceptions} onChange={(e) => updateStat("interceptions", e.target.value)} className="input text-xs py-1" /></div>
                      </>}
                      {(isRB || isWRTE) && <>
                        <div><label className="label text-xs">Targets</label><input type="number" value={stat.targets} onChange={(e) => updateStat("targets", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Rec</label><input type="number" value={stat.receptions} onChange={(e) => updateStat("receptions", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Rec Yds</label><input type="number" value={stat.receiving_yards} onChange={(e) => updateStat("receiving_yards", e.target.value)} className="input text-xs py-1" /></div>
                        <div><label className="label text-xs">Rec TD</label><input type="number" value={stat.receiving_tds} onChange={(e) => updateStat("receiving_tds", e.target.value)} className="input text-xs py-1" /></div>
                      </>}
                      {!isQB && !isRB && !isWRTE && (
                        <p className="col-span-full text-gray-600 text-xs italic py-2">
                          No stat columns for this position. Select QB, RB, WR, or TE to enter stats.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DEPTH CHART ───────────────────────────────────────────────── */}
          {tab === "depth" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Track depth chart position over time. Most recent snapshot appears on the profile.
                </p>
                <button
                  onClick={() => setDepths((p) => [...p, { ...BLANK_DEPTH, nfl_team: bio.nfl_team }])}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  + Add Snapshot
                </button>
              </div>

              {visibleDepths.length === 0 && (
                <p className="text-center text-gray-600 py-8 text-sm">No snapshots yet — click Add Snapshot.</p>
              )}

              {visibleDepths.map((depth, idx) => {
                const realIdx = depths.indexOf(depth);
                function updateDepth(k: string, v: string) {
                  setDepths((prev) => prev.map((d, i) => i === realIdx ? { ...d, [k]: v } : d));
                }
                return (
                  <div key={idx} className="bg-surface-2 rounded-xl border border-gray-700 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                      <div>
                        <label className="label">NFL Team</label>
                        <input value={depth.nfl_team} onChange={(e) => updateDepth("nfl_team", e.target.value)} className="input text-sm" placeholder="LV" maxLength={3} />
                      </div>
                      <div>
                        <label className="label">Position</label>
                        <input value={depth.position} onChange={(e) => updateDepth("position", e.target.value)} className="input text-sm" placeholder="RB" />
                      </div>
                      <div>
                        <label className="label">Depth Order</label>
                        <input type="number" min="1" max="5" value={depth.depth_order} onChange={(e) => updateDepth("depth_order", e.target.value)} className="input text-sm" />
                      </div>
                      <div>
                        <label className="label">Date</label>
                        <input type="date" value={depth.snapshot_date} onChange={(e) => updateDepth("snapshot_date", e.target.value)} className="input text-sm" />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="label">Source</label>
                          <select value={depth.source} onChange={(e) => updateDepth("source", e.target.value)} className="select text-sm">
                            <option value="manual">Manual</option>
                            <option value="rotowire">Rotowire</option>
                            <option value="nfl.com">NFL.com</option>
                            <option value="espn">ESPN</option>
                            <option value="sportsdata">SportsDataIO</option>
                          </select>
                        </div>
                        <button
                          onClick={() => setDepths((prev) => prev.map((d, i) => i === realIdx ? { ...d, isDeleted: true } : d))}
                          className="text-gray-600 hover:text-accent-red transition-colors pb-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-800 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={
              tab === "bio" || tab === "scouting" ? saveBioAndScouting
                : tab === "stats" ? saveCollegeStats
                : saveDepthChart
            }
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : `Save ${tab === "bio" ? "Bio" : tab === "scouting" ? "Scouting" : tab === "stats" ? "College Stats" : "Depth Chart"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
