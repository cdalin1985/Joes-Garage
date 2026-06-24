import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/Sidebar";
import { Topbar } from "@/components/nav/Topbar";
import { isAdmin } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = createClient();
  const { data: settings } = await supabase
    .from("shop_settings")
    .select("shop_name")
    .eq("id", 1)
    .single();

  const shopName = settings?.shop_name ?? "Joe's Garage";

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={isAdmin(profile)} shopName={shopName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={profile.full_name || profile.email || "Staff"} role={profile.role} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
