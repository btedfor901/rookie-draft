"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  teams: any[];
  users: any[];
}

export default function TeamsTab({ teams, users }: Props) {
  const router = useRouter();
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // New team form state
  const [newName, setNewName] = useState("");
  const [newAbbr, setNewAbbr] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const unassignedUsers = users.filter(
    (u) => !teams.some((t) => t.owner_id === u.id)
  );

  async function handleCreateTeam() {
    if (!newName || !newAbbr) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("fantasy_teams").insert({
      name: newName,
      abbreviation: newAbbr.toUpperCase(),
      owner_id: newOwner || null,
    });

    if (!error) {
      setNewName(""); setNewAbbr(""); setNewOwner("");
      setMsg("Team created.");
      router.refresh();
    } else {
      setMsg(`Error: ${error.message}`);
    }
    setSaving(false);
  }

  async function handleSaveTeam() {
    if (!editingTeam) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("fantasy_teams")
      .update({
        name: editingTeam.name,
        abbreviation: editingTeam.abbreviation.toUpperCase(),
        owner_id: editingTeam.owner_id || null,
      })
      .eq("id", editingTeam.id);

    if (!error) {
      setMsg("Team saved.");
      setEditingTeam(null);
      router.refresh();
    } else {
      setMsg(`Error: ${error.message}`);
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

      {/* Create team */}
      <div className="card">
        <h2 className="section-title mb-4">Create Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Team Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="Thunder Hawks" />
          </div>
          <div>
            <label className="label">Abbreviation</label>
            <input value={newAbbr} onChange={(e) => setNewAbbr(e.target.value)} className="input" placeholder="THK" maxLength={4} />
          </div>
          <div>
            <label className="label">Assign Owner (optional)</label>
            <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="select">
              <option value="">— No owner —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={handleCreateTeam} disabled={saving || !newName || !newAbbr} className="btn-primary">
            Create Team
          </button>
        </div>
      </div>

      {/* Team list */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-gray-800">
          <h2 className="section-title">All Teams ({teams.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-surface-2">
                <th className="table-header text-left">Team</th>
                <th className="table-header text-left">Abbr</th>
                <th className="table-header text-left">Owner</th>
                <th className="table-header text-left">Owner Email</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="table-row">
                  {editingTeam?.id === team.id ? (
                    <>
                      <td className="table-cell">
                        <input
                          value={editingTeam.name}
                          onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                          className="input text-sm py-1"
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          value={editingTeam.abbreviation}
                          onChange={(e) => setEditingTeam({ ...editingTeam, abbreviation: e.target.value })}
                          className="input text-sm py-1 w-20"
                          maxLength={4}
                        />
                      </td>
                      <td className="table-cell" colSpan={2}>
                        <select
                          value={editingTeam.owner_id ?? ""}
                          onChange={(e) => setEditingTeam({ ...editingTeam, owner_id: e.target.value || null })}
                          className="select text-sm py-1"
                        >
                          <option value="">— No owner —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={handleSaveTeam} disabled={saving} className="btn-primary text-xs px-3 py-1">
                            Save
                          </button>
                          <button onClick={() => setEditingTeam(null)} className="btn-secondary text-xs px-3 py-1">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="table-cell font-medium text-gray-100">{team.name}</td>
                      <td className="table-cell text-gray-400">{team.abbreviation}</td>
                      <td className="table-cell text-gray-300">{team.owner?.full_name ?? <span className="text-gray-600">Unassigned</span>}</td>
                      <td className="table-cell text-gray-500 text-xs">{team.owner?.email ?? "—"}</td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => setEditingTeam(team)}
                          className="btn-ghost text-xs px-3 py-1"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned users */}
      {unassignedUsers.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-3 text-accent-yellow">Unassigned Users</h2>
          <p className="text-xs text-gray-500 mb-3">
            These users have accounts but are not linked to any team yet.
          </p>
          <div className="space-y-2">
            {unassignedUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-gray-200">{u.full_name}</span>
                  <span className="text-xs text-gray-500 ml-2">{u.email}</span>
                </div>
                <span className="badge text-xs text-gray-500 bg-surface-3 border border-gray-700 capitalize">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
