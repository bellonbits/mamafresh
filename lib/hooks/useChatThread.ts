"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatMessageRow, ChatRole, ChatThreadRow } from "@/lib/supabase/types";

interface ProductContext {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface UseChatThreadOptions {
  threadId: string;
  myUserId: string;
  myRole: ChatRole;
}

const TYPING_TIMEOUT_MS = 2000;

export function useChatThread({ threadId, myUserId, myRole }: UseChatThreadOptions) {
  const [thread, setThread] = useState<ChatThreadRow | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherRole: ChatRole = myRole === "customer" ? "seller" : "customer";
  const unreadField = myRole === "customer" ? "customer_unread" : "seller_unread";

  const markRead = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await Promise.all([
      supabase.from("chat_messages").update({ status: "read" }).eq("thread_id", threadId).eq("sender_role", otherRole).neq("status", "read"),
      supabase.from("chat_threads").update({ [unreadField]: 0 }).eq("id", threadId),
    ]);
  }, [threadId, otherRole, unreadField]);

  // Initial fetch.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: threadRow }, { data: messageRows }] = await Promise.all([
        supabase.from("chat_threads").select("*").eq("id", threadId).maybeSingle(),
        supabase.from("chat_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setThread(threadRow as ChatThreadRow | null);
      setMessages((messageRows ?? []) as ChatMessageRow[]);
      setLoading(false);
      void markRead();
    };
    void load();
    return () => { active = false; };
  }, [threadId, markRead]);

  // Live message inserts/updates (delivery + read tick changes included).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat-messages-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` }, (payload) => {
        const row = payload.new as ChatMessageRow;
        setMessages((current) => (current.some((m) => m.id === row.id) ? current : [...current, row]));
        if (row.sender_role === otherRole) void markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` }, (payload) => {
        const row = payload.new as ChatMessageRow;
        setMessages((current) => current.map((m) => (m.id === row.id ? row : m)));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [threadId, otherRole, markRead]);

  // Presence: who's currently viewing this thread (online) and whether they're typing.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`chat-presence-${threadId}`, { config: { presence: { key: myUserId } } });
    presenceChannelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ role: ChatRole; typing: boolean }>();
        const peerEntries = Object.entries(state)
          .filter(([key]) => key !== myUserId)
          .flatMap(([, entries]) => entries);
        setPeerOnline(peerEntries.length > 0);
        setPeerTyping(peerEntries.some((entry) => entry.typing));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ role: myRole, typing: false });
      });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      presenceChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [threadId, myUserId, myRole]);

  const setTypingState = useCallback((isTyping: boolean) => {
    void presenceChannelRef.current?.track({ role: myRole, typing: isTyping });
  }, [myRole]);

  const notifyTyping = useCallback(() => {
    setTypingState(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTypingState(false), TYPING_TIMEOUT_MS);
  }, [setTypingState]);

  const send = useCallback(async (content: string, product?: ProductContext) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingState(false);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: threadId,
          sender_id: myUserId,
          sender_role: myRole,
          content: trimmed,
          product_id: product?.id ?? null,
          product_name: product?.name ?? null,
          product_image: product?.image ?? null,
          product_price: product?.price ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      setMessages((current) => (current.some((m) => m.id === data.id) ? current : [...current, data as ChatMessageRow]));
    } finally {
      setSending(false);
    }
  }, [threadId, myUserId, myRole, setTypingState]);

  return { thread, messages, loading, sending, peerOnline, peerTyping, send, notifyTyping };
}
