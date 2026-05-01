import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { positionSortKey, getPositionBadgeClass, formatCurrency } from "@/lib/utils";
import type { RosterSlot } from "@/types/database";

export const metadata = { title: "Roster | Rookie Draft" };

const SLOT_GROUPS = [
  { label: "Starters", positions: ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF"] },
  { label: "Taxi Squad", positions: ["TAXI"] },
  { label: "Injured Reserve", positions: ["IR"] },
  { label: "Bench", positions: ["BENCH"] },
];

export default async function RosterPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: team } = await supabase
    .from("fantasy_teams")
    .select("id, name, abbreviation")
    .eq("owner_id", authUser.id)
    .single();

  if (!team) {
    return (
      <div className="text-center py-16 text-gray-500">
        No team assigned. Contact your commissioner.
      </div>
    );
  }

  const { data: slots } = await supabase
    .from("roster_slots")
    .select("*, player:players(*)")
    .eq("fantasy_team_id", team.id);

  const rosterSlots: RosterSlot[] = (slots ?? []) as RosterSlot[];

  const byPosition = rosterSlots.reduce<Record<string, RosterSlot[]>>((acc, slot) => {
    if (!acc[slot.slot_position]) acc[slot.slot_position] = [];
    acc[slot.slot_position].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{team.name} — Roster</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {rosterSlots.length} players · {team.abbreviation}
        </p>
      </div>

      {SLOT_GROUPS.map((group) => {
        const groupSlots = group.positions
          .flatMap((pos) => byPosition[pos] ?? [])
          .sort((a, b) => positionSortKey(a.slot_position) - positionSortKey(b.slot_position));

        if (groupSlots.length === 0) return null;

        return (
          <div key={group.label} className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              {group.label}
              <span className="badge bg-surface-3 text-gray-400 text-xs">{groupSlots.length}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="table-header text-left w-20">Slot</th>
                    <th className="table-header text-left">Player</th>
                    <th className="table-header text-left">Position</th>
                    <th className="table-header text-left">NFL Team</th>
                    <th className="table-header text-left">Age</th>
                    <th className="table-header text-right">Salary</th>
                    <th className="table-header text-right">Years</th>
                    <th className="table-header text-left">Acquired</th>
                  </tr>
                </thead>
                <tbody>
                  {groupSlots.map((slot) => (
                    <tr key={slot.id} className="table-row">
                      <td className="table-cell">
                        <span className={`badge text-xs font-bold ${getPositionBadgeClass(slot.slot_position)}`}>
                          {slot.slot_position}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-gray-100">
                        {slot.player?.full_name ?? "—"}
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${getPositionBadgeClass(slot.player?.position ?? "")}`}>
                          {slot.player?.position ?? "—"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center justify-center w-8 h-6 bg-surface-3 rounded text-xs font-bold text-gray-300">
                          {slot.player?.nfl_team ?? "—"}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400">{slot.player?.age ?? "—"}</td>
                      <td className="table-cell text-right font-mono">
                        {slot.salary ? (
                          <span className="text-accent-yellow">{formatCurrency(slot.salary)}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="table-cell text-right text-gray-400">
                        {slot.contract_years ?? "—"}
                      </td>
                      <td className="table-cell capitalize text-gray-500 text-xs">
                        {slot.acquired_via ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {rosterSlots.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-500">No players on roster yet. Your commissioner will upload roster data.</p>
        </div>
      )}
    </div>
  );
}
