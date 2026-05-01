import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, positionSortKey, getPositionBadgeClass } from "@/lib/utils";
import type { RosterSlot, BankTransaction, DraftPick } from "@/types/database";

export const metadata = { title: "Dashboard | Rookie Draft" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Load user's team
  const { data: team } = await supabase
    .from("fantasy_teams")
    .select("*, owner:users(*)")
    .eq("owner_id", authUser.id)
    .single();

  // If no team assigned yet, show placeholder
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">🏈</div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">No team assigned yet</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Your commissioner hasn't linked your account to a fantasy team. Check back soon or reach out to your commissioner.
        </p>
      </div>
    );
  }

  // Load bank, roster, picks, transactions in parallel
  const [bankRes, rosterRes, picksRes, txRes] = await Promise.all([
    supabase.from("bank_accounts").select("*").eq("fantasy_team_id", team.id).single(),
    supabase
      .from("roster_slots")
      .select("*, player:players(*)")
      .eq("fantasy_team_id", team.id)
      .order("slot_position"),
    supabase
      .from("draft_picks")
      .select("*")
      .eq("fantasy_team_id", team.id)
      .eq("is_used", false)
      .order("draft_year")
      .order("draft_round"),
    supabase
      .from("bank_transactions")
      .select("*")
      .eq("fantasy_team_id", team.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const bank = bankRes.data;
  const rosterSlots: RosterSlot[] = (rosterRes.data ?? []) as RosterSlot[];
  const picks: DraftPick[] = (picksRes.data ?? []) as DraftPick[];
  const recentTransactions: BankTransaction[] = (txRes.data ?? []) as BankTransaction[];

  // Group roster by position order
  const sortedRoster = [...rosterSlots].sort(
    (a, b) => positionSortKey(a.slot_position) - positionSortKey(b.slot_position)
  );

  const positionGroups = sortedRoster.reduce<Record<string, RosterSlot[]>>((acc, slot) => {
    const pos = slot.slot_position;
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{team.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{team.owner?.full_name ?? "—"} · Dynasty League</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-brand/15 text-brand-light border border-brand/20 text-xs px-3 py-1">
            {team.abbreviation}
          </span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bank Balance</span>
          <span className="text-2xl font-bold text-accent-green">
            {bank ? formatCurrency(bank.balance) : "—"}
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Roster Size</span>
          <span className="text-2xl font-bold text-gray-100">{rosterSlots.length}</span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Draft Picks</span>
          <span className="text-2xl font-bold text-brand-light">{picks.length}</span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Transactions</span>
          <span className="text-2xl font-bold text-gray-100">{recentTransactions.length > 0 ? recentTransactions.length : "—"}</span>
        </div>
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster preview */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Current Roster</h2>
            <a href="/dashboard/roster" className="text-xs text-brand-light hover:underline">View all →</a>
          </div>
          {sortedRoster.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No players on roster yet.</p>
          ) : (
            <div className="space-y-1">
              {Object.entries(positionGroups).slice(0, 6).map(([pos, slots]) =>
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <span className={`badge text-xs font-bold w-12 justify-center ${getPositionBadgeClass(pos)}`}>
                      {pos}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-200">
                      {slot.player?.full_name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">{slot.player?.nfl_team ?? "—"}</span>
                    {slot.salary && (
                      <span className="text-xs text-accent-yellow font-mono">
                        {formatCurrency(slot.salary)}
                      </span>
                    )}
                  </div>
                ))
              )}
              {sortedRoster.length > 6 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{sortedRoster.length - 6} more players →{" "}
                  <a href="/dashboard/roster" className="text-brand-light hover:underline">View roster</a>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Draft picks */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-base">Draft Picks</h2>
            </div>
            {picks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No picks owned.</p>
            ) : (
              <div className="space-y-2">
                {picks.map((pick) => (
                  <div
                    key={pick.id}
                    className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-200">
                      {pick.draft_year} Round {pick.draft_round}
                    </span>
                    {pick.pick_number ? (
                      <span className="text-xs text-gray-400">Pick #{pick.pick_number}</span>
                    ) : (
                      <span className="text-xs text-gray-600">TBD</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-base">Recent Transactions</h2>
              <a href="/dashboard/bank" className="text-xs text-brand-light hover:underline">All →</a>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-600">{formatDate(tx.created_at)}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold flex-shrink-0 ${
                        tx.amount >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
