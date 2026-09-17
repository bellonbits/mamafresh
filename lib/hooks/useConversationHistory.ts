"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/hooks/useAssistantChat";
import { toPlainChatText } from "@/lib/assistant/text";

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSignedIn(false);
      setConversations([]);
      setLoading(false);
      return;
    }
    setIsSignedIn(true);
    const { data: convos } = await supabase
      .from("assistant_conversations")
      .select("id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const summaries: ConversationSummary[] = [];
    for (const convo of convos ?? []) {
      const { data: firstMessage } = await supabase
        .from("assistant_messages")
        .select("content")
        .eq("conversation_id", convo.id)
        .eq("role", "user")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      summaries.push({ id: convo.id, created_at: convo.created_at, title: firstMessage?.content?.slice(0, 48) ?? "New conversation" });
    }
    setConversations(summaries);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
  }, [refresh]);

  const loadMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    const { data } = await getSupabaseBrowserClient()
      .from("assistant_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    return (data ?? []).map((m) => ({ ...m, content: m.role === "assistant" ? toPlainChatText(m.content) : m.content })) as ChatMessage[];
  }, []);

  return { conversations, isSignedIn, loading, refresh, loadMessages };
}
