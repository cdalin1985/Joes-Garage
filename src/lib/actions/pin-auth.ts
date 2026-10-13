"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { matchPin } from "@/lib/shop-pin";

export type PinState = { error: string | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function enterWithPin(_prev: PinState, formData: FormData): Promise<PinState> {
  const pin = String(formData.get("pin") ?? "").trim();
  if (!pin) return { error: "Enter your PIN." };

  const account = matchPin(pin);
  if (!account) {
    // Small delay to blunt brute-force guessing of the PIN.
    await sleep(700);
    return { error: "That PIN didn't match. Try again." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (error) {
    return { error: "Couldn't sign in — the shop account may need setup. Use staff sign-in." };
  }

  redirect("/dashboard");
}
