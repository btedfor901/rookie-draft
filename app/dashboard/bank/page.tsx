import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BankTransaction } from "@/types/database";

export const metadata = { title: "Bank | Rookie Draft" };

const TX_LABELS: Record<string, { label: string; color: string }> = {
  deposit:    { label: "Deposit",     color: "text-accent-green bg-green-900/30 border-green-800" },
  withdrawal: { label: "Withdrawal",  color: "text-accent-red bg-red-900/30 border-red-800" },
  draft_cost: { label: "Draft Cost",  color: "text-accent-red bg-red-900/30 border-red-800" },
  trade:      { label: "Trade",       color: "text-brand-light bg-blue-900/30 border-blue-800" },
  adjustment: { label: "Adjustment",  color: "text-accent-yellow bg-yellow-900/30 border-yellow-800" },
  auction:    { label: "Auction",     color: "text-accent-purple bg-purple-900/30 border-purple-800" },
};

export default async function BankPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: team } = await supabase
    .from("fantasy_teams")
    .select("id, name")
    .eq("owner_id", authUser.id)
    .single();

  if (!team) {
    return <div className="text-center py-16 text-gray-500">No team assigned.</div>;
  }

  const [bankRes, txRes] = await Promise.all([
    supabase.from("bank_accounts").select("*").eq("fantasy_team_id", team.id).single(),
    supabase
      .from("bank_transactions")
      .select("*")
      .eq("fantasy_team_id", team.id)
      .order("created_at", { ascending: false }),
  ]);

  const bank = bankRes.data;
  const transactions: BankTransaction[] = (txRes.data ?? []) as BankTransaction[];

  // Compute summary stats
  const totalDeposited = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const draftCosts = transactions
    .filter((t) => t.type === "draft_cost" || t.type === "auction")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{team.name} — Bank</h1>
        <p className="text-gray-400 text-sm mt-0.5">Financial history and current balance</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card col-span-2 lg:col-span-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Balance</span>
          <span className="text-3xl font-bold text-accent-green">
            {bank ? formatCurrency(bank.balance) : "—"}
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Added</span>
          <span className="text-xl font-bold text-gray-100">{formatCurrency(totalDeposited)}</span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Spent</span>
          <span className="text-xl font-bold text-accent-red">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Draft Costs</span>
          <span className="text-xl font-bold text-accent-yellow">{formatCurrency(draftCosts)}</span>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="section-title mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No transactions on record yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="table-header text-left">Date</th>
                  <th className="table-header text-left">Description</th>
                  <th className="table-header text-left">Type</th>
                  <th className="table-header text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const meta = TX_LABELS[tx.type] ?? { label: tx.type, color: "text-gray-400 bg-surface-3 border-gray-700" };
                  return (
                    <tr key={tx.id} className="table-row">
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="table-cell text-gray-200">{tx.description}</td>
                      <td className="table-cell">
                        <span className={`badge text-xs border ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="table-cell text-right font-mono font-bold">
                        <span className={tx.amount >= 0 ? "text-accent-green" : "text-accent-red"}>
                          {tx.amount >= 0 ? "+" : ""}
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
