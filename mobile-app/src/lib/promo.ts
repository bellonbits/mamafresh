import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppliedPromo } from "@/lib/store/cart";

export async function validatePromoCode(supabase: SupabaseClient, rawCode: string): Promise<{ promo: AppliedPromo } | { error: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Enter a promo code." };

  const { data } = await supabase
    .from("promotions")
    .select("title, discount_percent, code, starts_at, ends_at")
    .eq("code", code)
    .maybeSingle();

  // RLS already only returns active promotions, so a miss here covers both
  // "no such code" and "code exists but isn't active" — same message either way.
  if (!data) return { error: "That promo code isn't valid." };

  const today = new Date().toISOString().slice(0, 10);
  if (data.starts_at > today || data.ends_at < today) return { error: "That promo code isn't valid right now." };

  return { promo: { code: data.code ?? code, discountPercent: data.discount_percent, title: data.title } };
}
