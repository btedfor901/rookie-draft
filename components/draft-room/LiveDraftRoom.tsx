"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPositionBadgeClass, cn } from "@/lib/utils";
import type { DraftSession, DraftPick, DraftResult, FantasyTeam } from "@/types/database";

interface RookieLite {
  id: string;
  full_name: string;
  position: string;
  nfl_team: string | null;
  college: string | null;
  nfl_draft_round: number | null;
  nfl_draft_pick: number | null;
  draft_status: string;
  drafted_by_team_id: string | null;
  drafted_by_team?: { id: string; name: string; abbreviation: string } | null;
}

interface Props {
  initialSession: DraftSession | null;
  draftPicks: DraftPick[];
  initialResults: DraftResult[];
  initialRookies: RookieLite[];
  teams: Pick<FantasyTeam, "id" | "name" | "abbreviation">[];
  userId: string;
  isCommissioner: boolean;
}

const POS_FILTERS = ["All", "QB", "RB", "WR", "TE"];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type FlashMsg = { text: string; kind: "ok" | "err" | "warn" };

export default function LiveDraftRoom({
  initialSession,
  draftPicks,
  initialResults,
  initialRookies,
  teams,
  isCommissioner,
}: Props) {
  // ── Core state ───────────────────────────────────────────────────────────────
  const [session, setSession] = useState<DraftSession | null>(initialSession);
  const [results, setResults] = useState<DraftResult[]>(initialResults);
  const [picks, setPicks] = useState<DraftPick[]>(draftPicks);
  const [rookies, setRookies] = useState<RookieLite[]>(initialRookies);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Commissioner form state ──────────────────────────────────────────────────
  const [selectedPickId, setSelectedPickId] = useState("");
  const [selectedRookieId, setSelectedRookieId] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [timerInput, setTimerInput] = useState("90");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  // Two-step confirmation state
  const [confirmPick, setConfirmPick] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  // Available players filter
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");

  // ── Refs for stale-closure-safe Realtime callbacks ───────────────────────────
  const rookiesRef = useRef(rookies);
  const picksRef = useRef(picks);
  const resultsRef = useRef(results);
  useEffect(() => { rookiesRef.current = rookies; }, [rookies]);
  useEffect(() => { picksRef.current = picks; }, [picks]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  // ── Derived state ────────────────────────────────────────────────────────────
  const orderedPicks = useMemo(
    () =>
      [...picks].sort((a, b) => {
        if (a.draft_round !== b.draft_round) return a.draft_round - b.draft_round;
        return (a.pick_number ?? 9999) - (b.pick_number ?? 9999);
      }),
    [picks]
  );

  const unusedPicks = useMemo(() => orderedPicks.filter((p) => !p.is_used), [orderedPicks]);
  const onTheClock = unusedPicks[0] ?? null;
  const upNext = unusedPicks.slice(1, 4);

  const availableRookies = useMemo(
    () => rookies.filter((r) => r.draft_status === "available"),
    [rookies]
  );

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => b.overall_pick - a.overall_pick),
    [results]
  );

  const currentPickNum = results.length + 1;
  const draftComplete = unusedPicks.length === 0 && results.length > 0;

  const filteredRookies = useMemo(() => {
    let list = availableRookies;
    if (posFilter !== "All") list = list.filter((r) => r.position === posFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.nfl_team?.toLowerCase().includes(q) ||
          r.college?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableRookies, posFilter, search]);

  // Resolve selected pick/rookie objects for the confirmation panel
  const selectedPickData = picks.find((p) => p.id === selectedPickId);
  const selectedRookieData = rookies.find((r) => r.id === selectedRookieId);
  const isOutOfOrder = !!(onTheClock && selectedPickId && selectedPickId !== onTheClock.id);

  // ── Auto-fill on-the-clock pick ──────────────────────────────────────────────
  useEffect(() => {
    if (onTheClock) {
      setSelectedPickId(onTheClock.id);
      setConfirmPick(false);
      setConfirmUndo(false);
    }
  }, [onTheClock?.id]);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.timer_ends_at) { setTimeLeft(null); return; }
    const tick = () => {
      const rem = Math.max(
        0,
        Math.floor((new Date(session.timer_ends_at!).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.timer_ends_at]);

  // ── Supabase Realtime subscription ───────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("live-draft-room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "draft_results" }, (payload) => {
        const nr = payload.new as DraftResult;
        if (resultsRef.current.some((r) => r.id === nr.id)) return;

        const rookie = rookiesRef.current.find((r) => r.id === nr.rookie_player_id);
        const team = teams.find((t) => t.id === nr.fantasy_team_id);
        const pick = picksRef.current.find((p) => p.id === nr.draft_pick_id);

        setResults((prev) => [...prev, {
          ...nr,
          rookie_player: rookie as any,
          fantasy_team: team as any,
          draft_pick: pick,
        }]);
        setRookies((prev) =>
          prev.map((r) =>
            r.id === nr.rookie_player_id
              ? { ...r, draft_status: "drafted", drafted_by_team_id: nr.fantasy_team_id, drafted_by_team: team }
              : r
          )
        );
        setPicks((prev) =>
          prev.map((p) => (p.id === nr.draft_pick_id ? { ...p, is_used: true } : p))
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "draft_results" }, (payload) => {
        const old = payload.old as { id: string };
        const deleted = resultsRef.current.find((r) => r.id === old.id);
        if (!deleted) return;

        setResults((prev) => prev.filter((r) => r.id !== old.id));
        setRookies((prev) =>
          prev.map((r) =>
            r.id === deleted.rookie_player_id
              ? { ...r, draft_status: "available", drafted_by_team_id: null, drafted_by_team: undefined }
              : r
          )
        );
        setPicks((prev) =>
          prev.map((p) => (p.id === deleted.draft_pick_id ? { ...p, is_used: false } : p))
        );
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_sessions" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setSession(null);
        } else {
          setSession(payload.new as DraftSession);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teams]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showFlash(text: string, kind: FlashMsg["kind"] = "ok") {
    setFlash({ text, kind });
    setTimeout(() => setFlash(null), 5000);
  }

  // ── Commissioner actions ─────────────────────────────────────────────────────

  async function handleToggleActive() {
    const supabase = createClient();
    try {
      if (!session) {
        const { error } = await supabase
          .from("draft_sessions")
          .insert({ is_active: true, started_at: new Date().toISOString() });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("draft_sessions")
          .update({ is_active: !session.is_active, updated_at: new Date().toISOString() })
          .eq("id", session.id);
        if (error) throw error;
      }
    } catch (e: any) {
      showFlash(`Failed to update draft status: ${e.message}`, "err");
    }
  }

  async function handleStartTimer(seconds?: number) {
    if (!session) return;
    const secs = seconds ?? (parseInt(timerInput) || 90);
    const timer_ends_at = new Date(Date.now() + secs * 1000).toISOString();
    const { error } = await createClient()
      .from("draft_sessions")
      .update({ timer_ends_at, timer_seconds: secs, updated_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) showFlash(`Timer error: ${error.message}`, "err");
  }

  async function handleClearTimer() {
    if (!session) return;
    await createClient()
      .from("draft_sessions")
      .update({ timer_ends_at: null, updated_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // Step 1: "Review Pick" — just opens the confirmation panel
  function handleReviewPick() {
    if (!selectedPickId || !selectedRookieId) return;
    setConfirmPick(true);
  }

  // Step 2: Actually submit after confirmation
  async function handleConfirmPick() {
    if (!selectedPickId || !selectedRookieId) return;
    setSaving(true);
    const supabase = createClient();

    const pick = picksRef.current.find((p) => p.id === selectedPickId);
    if (!pick) {
      showFlash("Pick not found — the board may have changed. Please refresh.", "err");
      setSaving(false);
      setConfirmPick(false);
      return;
    }

    // Guard: verify pick is still unused
    if (pick.is_used) {
      showFlash("That pick was already used — the board changed while you were selecting.", "err");
      setSaving(false);
      setConfirmPick(false);
      return;
    }

    // Guard: verify rookie is still available (prevent duplicate draft)
    const currentRookie = rookiesRef.current.find((r) => r.id === selectedRookieId);
    if (!currentRookie || currentRookie.draft_status !== "available") {
      showFlash(
        `${currentRookie?.full_name ?? "That player"} was already drafted. Please select another.`,
        "err"
      );
      setSelectedRookieId("");
      setSaving(false);
      setConfirmPick(false);
      return;
    }

    const overallPick = resultsRef.current.length + 1;

    const { error: resultErr } = await supabase.from("draft_results").insert({
      draft_pick_id: selectedPickId,
      rookie_player_id: selectedRookieId,
      fantasy_team_id: pick.fantasy_team_id,
      overall_pick: overallPick,
      bid_amount: bidAmount ? Math.round(parseFloat(bidAmount) * 100) : null,
    });

    if (resultErr) {
      showFlash(`Failed to record pick: ${resultErr.message}`, "err");
      setSaving(false);
      setConfirmPick(false);
      return;
    }

    // Mark pick used + mark rookie drafted (fire and forget — UI already updated via Realtime)
    await Promise.all([
      supabase.from("draft_picks").update({ is_used: true }).eq("id", selectedPickId),
      supabase.from("rookie_players")
        .update({ draft_status: "drafted", drafted_by_team_id: pick.fantasy_team_id })
        .eq("id", selectedRookieId),
    ]);

    // Restart timer automatically if one was configured
    if (session?.timer_seconds) {
      const timer_ends_at = new Date(Date.now() + session.timer_seconds * 1000).toISOString();
      await supabase.from("draft_sessions")
        .update({ timer_ends_at, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    } else if (session) {
      await supabase.from("draft_sessions")
        .update({ timer_ends_at: null, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }

    showFlash(`Pick #${overallPick} — ${currentRookie.full_name} — confirmed.`);
    setSelectedRookieId("");
    setBidAmount("");
    setConfirmPick(false);
    setSaving(false);
  }

  async function handleConfirmUndo() {
    if (sortedResults.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const last = sortedResults[0];
    const playerName = (last.rookie_player as any)?.full_name ?? "that player";

    const { error } = await supabase.from("draft_results").delete().eq("id", last.id);
    if (error) {
      showFlash(`Undo failed: ${error.message}`, "err");
      setSaving(false);
      setConfirmUndo(false);
      return;
    }

    await Promise.all([
      last.draft_pick_id
        ? supabase.from("draft_picks").update({ is_used: false }).eq("id", last.draft_pick_id)
        : Promise.resolve(),
      supabase.from("rookie_players")
        .update({ draft_status: "available", drafted_by_team_id: null })
        .eq("id", last.rookie_player_id),
    ]);

    if (session) {
      await supabase.from("draft_sessions")
        .update({ timer_ends_at: null, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }

    showFlash(`Pick #${last.overall_pick} (${playerName}) undone.`, "warn");
    setConfirmUndo(false);
    setSaving(false);
  }

  function handleExportCSV() {
    if (results.length === 0) return;
    const headers = ["Pick", "Player", "Position", "NFL Team", "Fantasy Team", "Bid"];
    const rows = [...results]
      .sort((a, b) => a.overall_pick - b.overall_pick)
      .map((r) => [
        String(r.overall_pick),
        (r.rookie_player as any)?.full_name ?? "",
        (r.rookie_player as any)?.position ?? "",
        (r.rookie_player as any)?.nfl_team ?? "FA",
        (r.fantasy_team as any)?.name ?? "",
        r.bid_amount ? `$${(r.bid_amount / 100).toFixed(2)}` : "",
      ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `draft_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Timer display ────────────────────────────────────────────────────────────
  const timerColor =
    timeLeft === null ? "text-gray-600"
    : timeLeft > 30 ? "text-accent-green"
    : timeLeft > 10 ? "text-yellow-400"
    : "text-red-400";
  const timerFlash = timeLeft !== null && timeLeft <= 10 && timeLeft % 2 === 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-100">Live Draft Room</h1>
            {session?.is_active && !draftComplete && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-900/30 border border-green-700 text-accent-green text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                LIVE
              </span>
            )}
            {session && !session.is_active && !draftComplete && (
              <span className="px-2.5 py-0.5 rounded-full bg-surface-3 border border-gray-700 text-gray-500 text-xs font-semibold">
                PAUSED
              </span>
            )}
            {draftComplete && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand/20 border border-brand/30 text-brand-light text-xs font-semibold">
                COMPLETE
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {draftComplete
              ? `Draft complete · ${results.length} picks recorded`
              : picks.length === 0
              ? "No picks configured — set up picks in the Admin Panel first"
              : `Pick ${currentPickNum} of ${picks.length} · ${availableRookies.length} players available`}
          </p>
        </div>

        {isCommissioner && !draftComplete && (
          <button
            onClick={handleToggleActive}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors border",
              session?.is_active
                ? "bg-yellow-900/30 border-yellow-700 text-yellow-300 hover:bg-yellow-900/50"
                : "bg-green-900/20 border-green-700 text-accent-green hover:bg-green-900/40"
            )}
          >
            {session?.is_active ? "Pause Draft" : session ? "Resume Draft" : "Start Draft"}
          </button>
        )}
      </div>

      {/* Flash message */}
      {flash && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm flex items-center justify-between border",
            flash.kind === "err"
              ? "bg-red-900/20 border-red-800 text-red-300"
              : flash.kind === "warn"
              ? "bg-yellow-900/20 border-yellow-800 text-yellow-300"
              : "bg-surface-2 border-gray-700 text-gray-300"
          )}
        >
          <span>{flash.text}</span>
          <button onClick={() => setFlash(null)} className="ml-4 text-gray-600 hover:text-gray-400">✕</button>
        </div>
      )}

      {/* No picks state */}
      {picks.length === 0 && (
        <div className="card text-center py-16 text-gray-500">
          <p className="text-lg font-semibold text-gray-400 mb-1">No draft picks configured</p>
          <p className="text-sm">Add picks in the Admin Panel, then return here to run the live draft.</p>
        </div>
      )}

      {picks.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* On the Clock card */}
            <div
              className={cn(
                "card border-2 transition-colors",
                session?.is_active && !draftComplete ? "border-accent-green/40" : "border-gray-700"
              )}
            >
              {!session && (
                <div className="py-6 text-center">
                  <p className="text-xl font-semibold text-gray-400">Draft Not Started</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {isCommissioner
                      ? 'Click "Start Draft" above to open the live room for all managers.'
                      : "Waiting for the commissioner to start the draft."}
                  </p>
                </div>
              )}

              {session && draftComplete && (
                <div className="py-6 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-xl font-bold text-brand-light">Draft Complete!</p>
                  <p className="text-sm text-gray-500 mt-1">{results.length} players drafted</p>
                </div>
              )}

              {session && !draftComplete && onTheClock && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {session.is_active ? "On the Clock" : "Up Next (Paused)"}
                    </p>
                    <p className="text-3xl font-bold text-gray-100 leading-tight">
                      {onTheClock.fantasy_team?.name ?? "Unknown Team"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Pick #{currentPickNum}
                      {" · "}Round {onTheClock.draft_round}
                      {onTheClock.pick_number ? ` · Slot ${onTheClock.pick_number}` : ""}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {timeLeft !== null ? (
                      <div
                        className={cn(
                          "text-5xl font-mono font-bold tabular-nums transition-colors",
                          timerColor,
                          timerFlash && "opacity-40"
                        )}
                      >
                        {formatTime(timeLeft)}
                      </div>
                    ) : (
                      <div className="text-4xl font-mono text-gray-800">—:——</div>
                    )}
                    {timeLeft === 0 && (
                      <p className="text-xs text-red-400 font-semibold mt-1 animate-pulse">Time's up!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Commissioner controls */}
            {isCommissioner && session && !draftComplete && (
              <div className="card border border-yellow-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-yellow-300">Commissioner Controls</h2>
                  <span className="text-xs text-gray-600">
                    Recording pick #{currentPickNum}
                    {saving && <span className="ml-2 text-brand-light animate-pulse">Saving…</span>}
                  </span>
                </div>

                {/* Pick selection form — hidden during confirmation step */}
                {!confirmPick && !confirmUndo && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Pick (Owning Team)</label>
                        <select
                          value={selectedPickId}
                          onChange={(e) => setSelectedPickId(e.target.value)}
                          className="select"
                        >
                          <option value="">— Select pick —</option>
                          {unusedPicks.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id === onTheClock?.id ? "★ " : ""}
                              {p.fantasy_team?.name} · Rd {p.draft_round}
                              {p.pick_number ? ` #${p.pick_number}` : ""}
                            </option>
                          ))}
                        </select>
                        {isOutOfOrder && (
                          <p className="text-xs text-yellow-400 mt-1">
                            ⚠ Out of order — {onTheClock?.fantasy_team?.name} is on the clock
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="label">Player</label>
                        <select
                          value={selectedRookieId}
                          onChange={(e) => setSelectedRookieId(e.target.value)}
                          className="select"
                        >
                          <option value="">— Select player —</option>
                          {availableRookies.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.full_name} ({r.position}{r.nfl_team ? `, ${r.nfl_team}` : ""})
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
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleReviewPick}
                        disabled={!selectedPickId || !selectedRookieId}
                        className="btn-primary"
                      >
                        Review Pick #{currentPickNum}
                      </button>
                      {results.length > 0 && (
                        <button
                          onClick={() => setConfirmUndo(true)}
                          disabled={saving}
                          className="btn-danger"
                        >
                          Undo Last Pick
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Pick confirmation panel */}
                {confirmPick && selectedPickData && selectedRookieData && (
                  <div className="bg-surface-3 border border-gray-700 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-200">Confirm this selection?</p>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-100 text-lg leading-tight">
                          {selectedRookieData.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`badge text-xs font-bold ${getPositionBadgeClass(
                              selectedRookieData.position
                            )}`}
                          >
                            {selectedRookieData.position}
                          </span>
                          <span className="text-xs text-gray-400">
                            {selectedRookieData.nfl_team ?? "FA"}
                          </span>
                        </div>
                      </div>
                      <span className="text-2xl text-gray-600">→</span>
                      <div>
                        <p className="font-bold text-gray-100">
                          {selectedPickData.fantasy_team?.name ?? "?"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pick #{currentPickNum} · Round {selectedPickData.draft_round}
                        </p>
                        {bidAmount && (
                          <p className="text-xs text-accent-yellow mt-0.5">
                            Bid: ${parseFloat(bidAmount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {isOutOfOrder && (
                      <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800 rounded p-2.5 text-sm text-yellow-300">
                        <span className="shrink-0 mt-0.5">⚠</span>
                        <span>
                          Out-of-order pick.{" "}
                          <strong>{onTheClock?.fantasy_team?.name}</strong> is currently on the
                          clock. Continue?
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmPick}
                        disabled={saving}
                        className="btn-primary"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                          </span>
                        ) : (
                          "Confirm Draft"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmPick(false)}
                        disabled={saving}
                        className="btn-secondary"
                      >
                        Edit Selection
                      </button>
                    </div>
                  </div>
                )}

                {/* Undo confirmation panel */}
                {confirmUndo && sortedResults[0] && (
                  <div className="bg-red-900/10 border border-red-800 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-300">Undo this pick?</p>
                    <div>
                      <p className="text-gray-200 font-medium">
                        Pick #{sortedResults[0].overall_pick}:{" "}
                        <strong>{(sortedResults[0].rookie_player as any)?.full_name ?? "—"}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Drafted by {(sortedResults[0].fantasy_team as any)?.name ?? "?"} ·
                        Pick will be restored and player returned to available.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmUndo}
                        disabled={saving}
                        className="btn-danger text-sm"
                      >
                        {saving ? "Undoing…" : "Yes, Undo"}
                      </button>
                      <button
                        onClick={() => setConfirmUndo(false)}
                        disabled={saving}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Timer controls */}
                {!confirmPick && !confirmUndo && (
                  <div className="border-t border-gray-800 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Pick Clock</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[60, 90, 120].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStartTimer(s)}
                          className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:border-brand/40 hover:text-brand-light transition-colors"
                        >
                          {s}s
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="10"
                          max="600"
                          value={timerInput}
                          onChange={(e) => setTimerInput(e.target.value)}
                          className="input w-20 text-sm"
                          placeholder="90"
                        />
                        <span className="text-xs text-gray-600">sec</span>
                        <button
                          onClick={() => handleStartTimer()}
                          className="btn-secondary text-xs py-1.5"
                        >
                          Start
                        </button>
                      </div>
                      {timeLeft !== null && (
                        <button
                          onClick={handleClearTimer}
                          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          Clear clock
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Commissioner pre-start CTA */}
            {isCommissioner && !session && (
              <div className="card border border-yellow-900/30 text-center py-6">
                <p className="text-yellow-300 font-semibold mb-1">Ready to Start</p>
                <p className="text-sm text-gray-500">
                  Click "Start Draft" above. All managers will see picks update in real time.
                </p>
              </div>
            )}

            {/* Manager read-only notice */}
            {!isCommissioner && session?.is_active && (
              <div className="rounded-lg px-4 py-3 bg-surface-2 border border-gray-800 text-sm text-gray-500 text-center">
                View only — only the commissioner can submit picks
              </div>
            )}

            {/* Available Players */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="section-title">
                  Available
                  <span className="ml-2 text-sm font-normal text-accent-green">
                    {availableRookies.length}
                  </span>
                </h2>
                {(search || posFilter !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setPosFilter("All"); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-40">
                  <input
                    type="search"
                    placeholder="Search name, NFL team, college…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {POS_FILTERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosFilter(p)}
                      className={cn("tab text-xs px-3 py-1.5", posFilter === p ? "tab-active" : "tab-inactive")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-surface-2">
                      <th className="table-header text-left">Player</th>
                      <th className="table-header text-left">Pos</th>
                      <th className="table-header text-left">NFL</th>
                      <th className="table-header text-left">Draft</th>
                      {isCommissioner && <th className="table-header text-right w-24">Select</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRookies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isCommissioner ? 5 : 4}
                          className="text-center py-10 text-gray-600 text-sm"
                        >
                          {availableRookies.length === 0
                            ? "All players have been drafted."
                            : "No players match your filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredRookies.map((rookie) => (
                        <tr
                          key={rookie.id}
                          className={cn(
                            "table-row",
                            isCommissioner && selectedRookieId === rookie.id && "bg-brand/5"
                          )}
                        >
                          <td className="table-cell font-medium text-gray-100">
                            {rookie.full_name}
                          </td>
                          <td className="table-cell">
                            <span className={`badge text-xs font-bold ${getPositionBadgeClass(rookie.position)}`}>
                              {rookie.position}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface-3 rounded text-xs font-bold text-gray-300 min-w-[2rem]">
                              {rookie.nfl_team ?? "FA"}
                            </span>
                          </td>
                          <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                            {rookie.nfl_draft_round ? (
                              `Rd ${rookie.nfl_draft_round} · #${rookie.nfl_draft_pick ?? "?"}`
                            ) : (
                              <span className="text-gray-600">UDFA</span>
                            )}
                          </td>
                          {isCommissioner && (
                            <td className="table-cell text-right">
                              <button
                                onClick={() =>
                                  setSelectedRookieId(
                                    selectedRookieId === rookie.id ? "" : rookie.id
                                  )
                                }
                                disabled={confirmPick || confirmUndo}
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded border transition-colors",
                                  selectedRookieId === rookie.id
                                    ? "bg-brand/20 border-brand/40 text-brand-light"
                                    : "border-gray-700 text-gray-600 hover:border-brand/30 hover:text-brand-light"
                                )}
                              >
                                {selectedRookieId === rookie.id ? "✓ Selected" : "Select"}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Up Next */}
            <div className="card">
              <h2 className="section-title mb-3">Up Next</h2>
              {upNext.length === 0 ? (
                <p className="text-sm text-gray-600">
                  {draftComplete ? "Draft complete" : onTheClock ? "No more picks after this" : "—"}
                </p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {upNext.map((pick, i) => (
                    <div key={pick.id} className="flex items-center gap-3 py-2.5">
                      <span className="text-xs font-mono text-gray-600 w-7 shrink-0">
                        #{currentPickNum + i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-300 truncate">
                          {pick.fantasy_team?.name ?? "?"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Rd {pick.draft_round}
                          {pick.pick_number ? ` · Slot ${pick.pick_number}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Draft Results / Audit Log */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">
                  Draft Log
                  <span className="ml-2 text-sm font-normal text-gray-600">{results.length}</span>
                </h2>
                {results.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                    title="Export draft results as CSV"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M8.75 2.75a.75.75 0 00-1.5 0v5.69L5.03 6.22a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06L8.75 8.44V2.75z" />
                      <path d="M3.5 9.75a.75.75 0 00-1.5 0v1.5A2.75 2.75 0 004.75 14h6.5A2.75 2.75 0 0014 11.25v-1.5a.75.75 0 00-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5z" />
                    </svg>
                    CSV
                  </button>
                )}
              </div>

              {sortedResults.length === 0 ? (
                <p className="text-sm text-gray-600">No picks yet.</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {sortedResults.slice(0, 20).map((result) => (
                    <div key={result.id} className="flex items-start gap-3 py-2.5">
                      <span className="text-xs font-mono text-gray-600 pt-0.5 w-7 shrink-0">
                        #{result.overall_pick}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm text-gray-100 leading-tight">
                            {(result.rookie_player as any)?.full_name ?? "—"}
                          </span>
                          {(result.rookie_player as any)?.position && (
                            <span
                              className={`badge text-xs ${getPositionBadgeClass(
                                (result.rookie_player as any).position
                              )}`}
                            >
                              {(result.rookie_player as any).position}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(result.rookie_player as any)?.nfl_team ?? "FA"}
                          {" → "}
                          {(result.fantasy_team as any)?.name ?? "?"}
                          {result.bid_amount
                            ? ` · $${(result.bid_amount / 100).toFixed(2)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {results.length > 20 && (
                    <p className="text-xs text-gray-600 pt-2 text-center">
                      Showing last 20 of {results.length} picks
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Draft complete banner */}
            {draftComplete && (
              <div className="card bg-brand/10 border border-brand/20 text-center py-8">
                <div className="text-4xl mb-2">🏆</div>
                <p className="font-bold text-brand-light text-lg">Draft Complete!</p>
                <p className="text-sm text-gray-400 mt-1">{results.length} players drafted</p>
                <button
                  onClick={handleExportCSV}
                  className="mt-4 btn-secondary text-sm"
                >
                  Export Full Results CSV
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
