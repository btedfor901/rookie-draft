import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DraftBoardHub from "@/components/draft-board/DraftBoardHub";
import {
  MOCK_TEAMS,
  MOCK_PICKS,
  MOCK_ROOKIES,
  type DraftBoardTeam,
  type DraftBoardPick,
  type DraftBoardRookie,
} from "@/lib/mock-data";

export const metadata = { title: "Draft Board | Rookie Draft" };

export default async function DraftBoardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  const isCommissioner = userRow?.role === "commissioner";

  // Check if Supabase data exists — fall back to mock if teams OR picks are missing
  const [{ data: dbTeams }, { count: pickCount }] = await Promise.all([
    supabase.from("fantasy_teams").select("id, name, abbreviation"),
    supabase.from("draft_picks").select("id", { count: "exact", head: true }),
  ]);

  const isMockMode = !dbTeams || dbTeams.length === 0 || !pickCount || pickCount === 0;

  if (isMockMode) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Rookie Draft Board</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {MOCK_ROOKIES.length} players · {MOCK_ROOKIES.filter((r) => r.draftStatus === "available").length} available ·{" "}
            {MOCK_PICKS.length} picks · {MOCK_TEAMS.length} teams
          </p>
        </div>
        <DraftBoardHub
          teams={MOCK_TEAMS}
          initialPicks={MOCK_PICKS}
          initialRookies={MOCK_ROOKIES}
          isCommissioner={isCommissioner}
          userId={authUser.id}
          isMockMode={true}
        />
      </div>
    );
  }

  // ── Supabase data path ──────────────────────────────────────────────────────

  const [teamsRes, picksRes, resultsRes, rookiesRes, bankRes] = await Promise.all([
    supabase.from("fantasy_teams").select("id, name, abbreviation"),
    supabase
      .from("draft_picks")
      .select("id, fantasy_team_id, original_team_id, draft_round, pick_number, is_used")
      .order("draft_round")
      .order("pick_number"),
    supabase
      .from("draft_results")
      .select("draft_pick_id, rookie_player_id, fantasy_team_id, overall_pick, drafted_at"),
    supabase
      .from("rookie_players")
      .select("id, full_name, position, nfl_team, college, nfl_draft_round, nfl_draft_pick, draft_status, drafted_by_team_id, depth_chart_position, fantasy_outlook")
      .order("nfl_draft_round", { ascending: true, nullsFirst: false })
      .order("nfl_draft_pick", { ascending: true, nullsFirst: false }),
    supabase.from("bank_accounts").select("fantasy_team_id, balance"),
  ]);

  const bankMap = new Map(
    (bankRes.data ?? []).map((b) => [b.fantasy_team_id, b.balance as number])
  );

  const teams: DraftBoardTeam[] = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    abbreviation: t.abbreviation,
    bankCents: bankMap.get(t.id) ?? 0,
  }));

  // Build result map: pick_id → { playerId, draftedAt }
  const resultMap = new Map(
    (resultsRes.data ?? []).map((r) => [
      r.draft_pick_id,
      { playerId: r.rookie_player_id, draftedAt: r.drafted_at ?? null },
    ])
  );

  // Calculate overall pick numbers: sort picks by round then pick_number
  const rawPicks = (picksRes.data ?? []).sort((a, b) =>
    a.draft_round !== b.draft_round
      ? a.draft_round - b.draft_round
      : (a.pick_number ?? 0) - (b.pick_number ?? 0)
  );

  const picks: DraftBoardPick[] = rawPicks.map((p, i) => {
    const result = resultMap.get(p.id);
    const pickInRound = p.pick_number ?? i + 1;
    return {
      id: p.id,
      overallPick: i + 1,
      round: p.draft_round,
      pickInRound,
      label: `${p.draft_round}.${String(pickInRound).padStart(2, "0")}`,
      currentTeamId: p.fantasy_team_id,
      originalTeamId: p.original_team_id,
      isTraded: p.fantasy_team_id !== p.original_team_id,
      draftedPlayerId: result?.playerId ?? null,
      draftedAt: result?.draftedAt ?? null,
    };
  });

  const rookies: DraftBoardRookie[] = (rookiesRes.data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    position: r.position,
    nflTeam: r.nfl_team,
    college: r.college,
    nflDraftRound: r.nfl_draft_round,
    nflDraftPick: r.nfl_draft_pick,
    draftStatus: r.draft_status === "drafted" ? "drafted" : "available",
    draftedByTeamId: r.drafted_by_team_id,
    depthChartPosition: r.depth_chart_position,
    fantasyOutlook: r.fantasy_outlook,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Rookie Draft Board</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {rookies.length} players · {rookies.filter((r) => r.draftStatus === "available").length} available ·{" "}
          {picks.length} picks · {teams.length} teams
        </p>
      </div>
      <DraftBoardHub
        teams={teams}
        initialPicks={picks}
        initialRookies={rookies}
        isCommissioner={isCommissioner}
        userId={authUser.id}
        isMockMode={false}
      />
    </div>
  );
}
