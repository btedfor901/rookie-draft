"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  teams: any[];
}

const POSITIONS = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF", "BENCH", "TAXI", "IR"];
const ACQUIRED_OPTIONS = ["draft", "trade", "waiver", "free_agent", "startup"];

export default function RosterAdminTab({ teams }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add player form
  const [teamId, setTeamId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("QB");
  const [slotPos, setSlotPos] = useState("QB");
  const [nflTeam, setNflTeam] = useState("");
  const [age, setAge] = useState("");
  const [salary, setSalary] = useState("");
  const [contractYears, setContractYears] = useState("");
  const [acquired, setAcquired] = useState("draft");

  async function handleAddPlayer() {
    if (!teamId || !firstName || !lastName || !position) return;
    setSaving(true);
    const supabase = createClient();

    // Upsert player
    const { data: player, error: playerErr } = await supabase
      .from("players")
      .insert({
        first_name: firstName,
        last_name: lastName,
        position,
        nfl_team: nflTeam || null,
        age: age ? parseInt(age) : null,
      })
      .select()
      .single();

    if (playerErr) {
      setMsg(`Player error: ${playerErr.message}`);
      setSaving(false);
      return;
    }

    const { error: slotErr } = await supabase.from("roster_slots").upsert({
      fantasy_team_id: teamId,
      player_id: player.id,
      slot_position: slotPos,
      salary: salary ? Math.round(parseFloat(salary) * 100) : null,
      contract_years: contractYears ? parseInt(contractYears) : null,
      acquired_via: acquired,
    }, { onConflict: "fantasy_team_id,player_id" });

    if (slotErr) {
      setMsg(`Roster error: ${slotErr.message}`);
    } else {
      setMsg("Player added to roster.");
      setFirstName(""); setLastName(""); setNflTeam(""); setAge(""); setSalary(""); setContractYears("");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className="bg-surface-2 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300">
          {msg}
        </div>
      )}

      <div className="card">
        <h2 className="section-title mb-4">Add Player to Roster</h2>
        <p className="text-xs text-gray-500 mb-4">
          {/* TODO: Add CSV import for bulk roster upload — parse with papaparse */}
          For bulk imports, use the CSV upload below. Manual entry is for individual players.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <label className="label">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="select">
              <option value="">— Select team —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" placeholder="Patrick" />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" placeholder="Mahomes" />
          </div>
          <div>
            <label className="label">Position</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="select">
              {["QB","RB","WR","TE","K","DEF"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Slot</label>
            <select value={slotPos} onChange={(e) => setSlotPos(e.target.value)} className="select">
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">NFL Team</label>
            <input value={nflTeam} onChange={(e) => setNflTeam(e.target.value)} className="input" placeholder="KC" maxLength={3} />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="input" placeholder="27" />
          </div>
          <div>
            <label className="label">Salary ($)</label>
            <input type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} className="input" placeholder="50.00" />
          </div>
          <div>
            <label className="label">Contract Yrs</label>
            <input type="number" value={contractYears} onChange={(e) => setContractYears(e.target.value)} className="input" placeholder="3" />
          </div>
          <div>
            <label className="label">Acquired Via</label>
            <select value={acquired} onChange={(e) => setAcquired(e.target.value)} className="select">
              {ACQUIRED_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={handleAddPlayer} disabled={saving || !teamId || !firstName || !lastName} className="btn-primary">
            Add to Roster
          </button>
        </div>
      </div>
    </div>
  );
}
