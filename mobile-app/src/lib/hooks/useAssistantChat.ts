import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { postAssistantMessage } from "@/lib/assistant/client";
import { API_BASE_URL } from "@/lib/config";
import type { ProductRow } from "@/lib/supabase/types";

export type ShoppingListItem = ProductRow & { quantity: number };
export type ChatMessage = { role: "user" | "assistant"; content: string; items?: ShoppingListItem[] };

export function useAssistantChat(initialMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: initialMessage }]);
  const [sending, setSending] = useState(false);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setSending(true);
    const result = await postAssistantMessage<ShoppingListItem>(`${API_BASE_URL}/api/assistant`, {
      messages: next.map(({ role, content }) => ({ role, content })),
      conversationId,
    });
    if (result.conversationId) setConversationId(result.conversationId);
    setMessages((current) => [...current, { role: "assistant", content: result.content, items: result.items?.length ? result.items : undefined }]);
    setSending(false);
  };

  const startNewChat = (greeting: string) => {
    setMessages([{ role: "assistant", content: greeting }]);
    setConversationId(null);
    setConflictNotice(null);
  };

  const loadConversation = (id: string, loadedMessages: ChatMessage[]) => {
    setConversationId(id);
    setMessages(loadedMessages);
    setConflictNotice(null);
  };

  const addToCart = (item: ShoppingListItem) => {
    const { conflict } = addItem(item, item.quantity);
    setConflictNotice(conflict ? `${item.name} is from a different seller than what's already in your cart.` : null);
  };

  const addAllToCart = (items: ShoppingListItem[]) => {
    let skipped = 0;
    for (const item of items) {
      const { conflict } = addItem(item, item.quantity);
      if (conflict) skipped += 1;
    }
    setConflictNotice(skipped > 0 ? `${skipped} item(s) skipped — from a different seller than your current cart.` : null);
  };

  return { messages, sending, conflictNotice, conversationId, send, addToCart, addAllToCart, startNewChat, loadConversation };
}
