import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WatchlistPageClient from "@/components/watchlist/WatchlistPageClient";

export const metadata = { title: "Watchlist | Rookie Draft" };

export default async function WatchlistPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: watchlistRows } = await supabase
    .from("watchlists")
    .select(`
      id,
      created_at,
      rookie_player:rookie_players(
        *,
        drafted_by_team:fantasy_teams(id, name, abbreviation),
        college_stats(*),
        depth_chart_snapshots(*)
      )
    `)
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("rookie_notes")
    .select("rookie_player_id, note, id")
    .eq("user_id", authUser.id);

  const noteMap = new Map((notes ?? []).map((n) => [n.rookie_player_id, { note: n.note, id: n.id }]));

  const entries = (watchlistRows ?? []).map((row: any) => {
    const r = row.rookie_player;
    const stats = (r?.college_stats ?? []) as { season: number }[];
    const finalSeason = stats.length > 0
      ? stats.reduce((a: any, b: any) => (b.season > a.season ? b : a))
      : null;
    const depths = (r?.depth_chart_snapshots ?? []) as { snapshot_date: string }[];
    const latestDepth = depths.length > 0
      ? depths.reduce((a: any, b: any) => (b.snapshot_date > a.snapshot_date ? b : a))
      : null;
    const userNote = noteMap.get(r?.id) ?? null;

    return {
      watchlistId: row.id,
      addedAt: row.created_at,
      rookie: r,
      finalSeason,
      latestDepth,
      userNote,
    };
  }).filter((e) => e.rookie);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">My Watchlist</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {entries.length} {entries.length === 1 ? "player" : "players"} · Private to you
        </p>
      </div>
      <WatchlistPageClient entries={entries} userId={authUser.id} />
    </div>
  );
}
