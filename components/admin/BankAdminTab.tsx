"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Props {
  teams: any[];
}

const TX_TYPES = [
  { value: "deposit",    label: "Deposit (add money)" },
  { value: "withdrawal", label: "Withdrawal (remove money)" },
  { value: "draft_cost", label: "Draft Cost" },
  { value: "trade",      label: "Trade" },
  { value: "adjustment", label: "Manual Adjustment" },
  { value: "auction",    label: "Auction" },
];

export default function BankAdminTab({ teams }: Props) {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("adjustment");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAddTransaction() {
    if (!teamId || !amount || !description) return;
    setSaving(true);

    const supabase = createClient();
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    const parsedAmount = Math.round(parseFloat(amount) * 100);
    const isCredit = type === "deposit" || type === "trade";
    const finalAmount = isCredit ? Math.abs(parsedAmount) : -Math.abs(parsedAmount);

    const { error: txError } = await supabase.from("bank_transactions").insert({
      fantasy_team_id: teamId,
      amount: finalAmount,
      type,
      description,
      created_by: session.user.id,
    });

    if (txError) {
      setMsg(`Error: ${txError.message}`);
      setSaving(false);
      return;
    }

    // Update bank balance
    const { data: bank } = await supabase
      .from("bank_accounts")
      .select("balance")
      .eq("fantasy_team_id", teamId)
      .single();

    if (bank) {
      await supabase
        .from("bank_accounts")
        .update({ balance: bank.balance + finalAmount })
        .eq("fantasy_team_id", teamId);
    }

    setMsg(`Transaction added. ${finalAmount >= 0 ? "+" : ""}${formatCurrency(Math.abs(finalAmount))}`);
    setAmount("");
    setDescription("");
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className="bg-surface-2 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300">
          {msg}
        </div>
      )}

      {/* Add transaction */}
      <div className="card">
        <h2 className="section-title mb-4">Add Transaction</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="select">
              <option value="">— Select team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="select">
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="50.00"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="2025 Round 1 pick bid"
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={handleAddTransaction}
            disabled={saving || !teamId || !amount || !description}
            className="btn-primary"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* Balances overview */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-gray-800">
          <h2 className="section-title">Current Balances</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left">Team</th>
                <th className="table-header text-left">Owner</th>
                <th className="table-header text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const balance = team.bank_account?.[0]?.balance ?? 0;
                return (
                  <tr key={team.id} className="table-row">
                    <td className="table-cell font-medium text-gray-100">{team.name}</td>
                    <td className="table-cell text-gray-400">{team.owner?.full_name ?? "—"}</td>
                    <td className="table-cell text-right font-mono font-bold">
                      <span className={balance >= 0 ? "text-accent-green" : "text-accent-red"}>
                        {formatCurrency(balance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
