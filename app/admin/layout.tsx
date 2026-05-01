import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!user || user.role !== "commissioner") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} teamName="Commissioner" />
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
