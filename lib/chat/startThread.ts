"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatThreadRow } from "@/lib/supabase/types";

/** Finds the existing (customer, seller) thread or creates one — chat is one continuous conversation per pair, reused across products. */
export async function findOrCreateThread(customerId: string, sellerId: string): Promise<ChatThreadRow> {
  const supabase = getSupabaseBrowserClient();
  const { data: existing } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("customer_id", customerId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (existing) return existing as ChatThreadRow;

  const { data: created, error } = await supabase
    .from("chat_threads")
    .insert({ customer_id: customerId, seller_id: sellerId })
    .select("*")
    .single();
  if (error) {
    // Another tab/request likely created it first under our unique(customer_id, seller_id) constraint.
    const { data: raced } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("customer_id", customerId)
      .eq("seller_id", sellerId)
      .maybeSingle();
    if (raced) return raced as ChatThreadRow;
    throw error;
  }
  return created as ChatThreadRow;
}
