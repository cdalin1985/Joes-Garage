import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";

export default function Home() {
  if (!isSupabaseConfigured()) redirect("/setup");
  redirect("/dashboard");
}
