import { createClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/admin/AdminTabs";

export const metadata = { title: "Admin Panel | Rookie Draft" };

export default async function AdminPage() {
  const supabase = await createClient();

  const [teamsRes, usersRes, rookiesRes, picksRes, resultsRes] = await Promise.all([
    supabase.from("fantasy_teams").select(`
      *,
      owner:users(*),
      bank_account:bank_accounts(*)
    `).order("name"),
    supabase.from("users").select("*").order("full_name"),
    supabase.from("rookie_players").select(`
      *,
      drafted_by_team:fantasy_teams(id, name, abbreviation),
      college_stats(*),
      depth_chart_snapshots(*)
    `).order("nfl_draft_round", { ascending: true, nullsFirst: false })
      .order("nfl_draft_pick", { ascending: true, nullsFirst: false }),
    supabase.from("draft_picks").select(`
      *,
      fantasy_team:fantasy_teams(id, name, abbreviation),
      original_team:fantasy_teams!draft_picks_original_team_id_fkey(id, name, abbreviation)
    `).order("draft_year").order("draft_round").order("pick_number"),
    supabase.from("draft_results").select(`
      *,
      rookie_player:rookie_players(id, full_name, position, nfl_team),
      fantasy_team:fantasy_teams(id, name, abbreviation)
    `).order("overall_pick"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Commissioner Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage teams, bank, rookies, and draft operations
          </p>
        </div>
        <span className="badge bg-yellow-900/30 text-yellow-300 border border-yellow-700 text-xs px-3 py-1">
          Commissioner
        </span>
      </div>

      <AdminTabs
        teams={teamsRes.data ?? []}
        users={usersRes.data ?? []}
        rookies={rookiesRes.data ?? []}
        picks={picksRes.data ?? []}
        results={resultsRes.data ?? []}
      />
    </div>
  );
}
