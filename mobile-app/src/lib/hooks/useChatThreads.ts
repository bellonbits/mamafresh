"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatRole, ChatThreadRow } from "@/lib/supabase/types";

export interface ChatThreadWithPeer extends ChatThreadRow {
  peerName: string;
  peerAvatar: string;
  unread: number;
}

interface UseChatThreadsOptions {
  role: ChatRole;
  /** customer_id for role "customer"; the seller's shop id for role "seller". */
  filterId: string | null;
}

export function useChatThreads({ role, filterId }: UseChatThreadsOptions) {
  const [threads, setThreads] = useState<ChatThreadWithPeer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filterId) { setThreads([]); setLoading(false); return; }
    const supabase = getSupabaseBrowserClient();
    const column = role === "customer" ? "customer_id" : "seller_id";
    const { data: rows } = await supabase
      .from("chat_threads")
      .select("*")
      .eq(column, filterId)
      .order("last_message_at", { ascending: false });
    const threadRows = (rows ?? []) as ChatThreadRow[];

    if (threadRows.length === 0) { setThreads([]); setLoading(false); return; }

    if (role === "customer") {
      const sellerIds = Array.from(new Set(threadRows.map((t) => t.seller_id)));
      const { data: sellers } = await supabase.from("sellers").select("id,name,logo_url").in("id", sellerIds);
      const byId = new Map((sellers ?? []).map((s) => [s.id, s]));
      setThreads(threadRows.map((t) => ({
        ...t,
        peerName: byId.get(t.seller_id)?.name ?? "Seller",
        peerAvatar: byId.get(t.seller_id)?.logo_url ?? "",
        unread: t.customer_unread,
      })));
    } else {
      const customerIds = Array.from(new Set(threadRows.map((t) => t.customer_id)));
      const { data: profiles } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", customerIds);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      setThreads(threadRows.map((t) => ({
        ...t,
        peerName: byId.get(t.customer_id)?.full_name || "Customer",
        peerAvatar: byId.get(t.customer_id)?.avatar_url ?? "",
        unread: t.seller_unread,
      })));
    }
    setLoading(false);
  }, [role, filterId]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  // Live-refresh the list whenever any of my threads change (new message, unread count, etc).
  useEffect(() => {
    if (!filterId) return;
    const supabase = getSupabaseBrowserClient();
    const column = role === "customer" ? "customer_id" : "seller_id";
    const channel = supabase
      .channel(`chat-threads-${role}-${filterId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_threads", filter: `${column}=eq.${filterId}` }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [role, filterId, load]);

  return { threads, loading, refresh: load };
}
