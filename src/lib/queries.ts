import { createClient } from "@/lib/supabase/server";
import type { Customer, Part, ShopSettings, Vehicle } from "@/lib/database.types";

/** Reference data needed by the estimate / invoice / work-order editors. */
export async function getEditorData() {
  const supabase = createClient();
  const [{ data: customers }, { data: vehicles }, { data: parts }, { data: settings }] =
    await Promise.all([
      supabase.from("customers").select("*").order("last_name").order("company"),
      supabase.from("vehicles").select("*").order("make"),
      supabase.from("parts").select("*").eq("is_active", true).order("name"),
      supabase.from("shop_settings").select("*").eq("id", 1).single(),
    ]);

  return {
    customers: (customers as Customer[]) ?? [],
    vehicles: (vehicles as Vehicle[]) ?? [],
    parts: (parts as Part[]) ?? [],
    settings: (settings as ShopSettings | null) ?? null,
  };
}

export async function getShopSettings(): Promise<ShopSettings | null> {
  const supabase = createClient();
  const { data } = await supabase.from("shop_settings").select("*").eq("id", 1).single();
  return (data as ShopSettings | null) ?? null;
}
