import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [userRes, teamRes, watchlistRes, sessionRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", authUser.id).single(),
    supabase.from("fantasy_teams").select("name").eq("owner_id", authUser.id).single(),
    supabase.from("watchlists").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
    supabase.from("draft_sessions").select("is_active").order("created_at").limit(1).maybeSingle(),
  ]);

  if (!userRes.data) redirect("/login");

  const watchlistCount = watchlistRes.count ?? 0;
  const isDraftLive = sessionRes.data?.is_active ?? false;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={userRes.data}
        teamName={teamRes.data?.name}
        watchlistCount={watchlistCount}
        isDraftLive={isDraftLive}
      />
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
