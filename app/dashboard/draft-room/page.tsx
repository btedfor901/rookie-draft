import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveDraftRoom from "@/components/draft-room/LiveDraftRoom";

export const metadata = { title: "Live Draft Room | Rookie Draft" };

export default async function DraftRoomPage() {
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

  const [sessionRes, picksRes, resultsRes, rookiesRes, teamsRes] = await Promise.all([
    supabase
      .from("draft_sessions")
      .select("*")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("draft_picks")
      .select(`
        *,
        fantasy_team:fantasy_teams(id, name, abbreviation),
        original_team:fantasy_teams!draft_picks_original_team_id_fkey(id, name, abbreviation)
      `)
      .order("draft_round")
      .order("pick_number"),
    supabase
      .from("draft_results")
      .select(`
        *,
        rookie_player:rookie_players(id, full_name, position, nfl_team, college, nfl_draft_round, nfl_draft_pick),
        fantasy_team:fantasy_teams(id, name, abbreviation),
        draft_pick:draft_picks(id, draft_round, pick_number)
      `)
      .order("overall_pick"),
    supabase
      .from("rookie_players")
      .select(`
        id, full_name, first_name, last_name, position, nfl_team, college,
        nfl_draft_round, nfl_draft_pick, draft_status, drafted_by_team_id,
        drafted_by_team:fantasy_teams(id, name, abbreviation)
      `)
      .order("nfl_draft_round", { ascending: true, nullsFirst: false })
      .order("nfl_draft_pick", { ascending: true, nullsFirst: false }),
    supabase
      .from("fantasy_teams")
      .select("id, name, abbreviation")
      .order("name"),
  ]);

  return (
    <LiveDraftRoom
      initialSession={sessionRes.data ?? null}
      draftPicks={picksRes.data ?? []}
      initialResults={resultsRes.data ?? []}
      initialRookies={(rookiesRes.data ?? []).map((r) => ({
          ...r,
          drafted_by_team: Array.isArray(r.drafted_by_team)
            ? (r.drafted_by_team[0] ?? null)
            : (r.drafted_by_team ?? null),
        }))}
      teams={teamsRes.data ?? []}
      userId={authUser.id}
      isCommissioner={isCommissioner}
    />
  );
}
