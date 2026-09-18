
import { useEffect, useRef, useState } from "react";
import Link from "@/lib/next-compat/link";
import { ChevronLeft, Send } from "lucide-react";
import ChatAvatar from "@/components/chat/ChatAvatar";
import ChatBubble from "@/components/chat/ChatBubble";
import { useChatThread } from "@/lib/hooks/useChatThread";
import { cn } from "@/lib/utils";
import type { ChatRole } from "@/lib/supabase/types";

interface ProductContext {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface Props {
  threadId: string;
  myUserId: string;
  myRole: ChatRole;
  peerName: string;
  peerAvatar: string;
  backHref?: string;
  initialProduct?: ProductContext;
  initialMessage?: string;
  /** false to fill the parent's height instead of the full viewport — for embedding inside a dashboard shell. */
  fullScreen?: boolean;
}

export default function ChatWindow({ threadId, myUserId, myRole, peerName, peerAvatar, backHref, initialProduct, initialMessage, fullScreen = true }: Props) {
  const { messages, loading, sending, peerOnline, peerTyping, send, notifyTyping } = useChatThread({ threadId, myUserId, myRole });
  const [input, setInput] = useState(initialMessage ?? "");
  const [productAttached, setProductAttached] = useState(!!initialProduct);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, peerTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const attachProduct = productAttached ? initialProduct : undefined;
    setProductAttached(false);
    await send(text, attachProduct);
  };

  return (
    <div className={cn("flex w-full flex-col bg-[#F4F7F4]", fullScreen ? "h-screen" : "h-full")}>
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shadow-xs">
        {backHref && (
          <Link href={backHref} aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <ChevronLeft size={20} />
          </Link>
        )}
        <ChatAvatar name={peerName} avatarUrl={peerAvatar} size={38} online={peerOnline} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-gray-900">{peerName}</p>
          <p className="h-3.5 text-[11px] font-medium text-[#16A34A]">
            {peerTyping ? "typing..." : peerOnline ? "Online" : ""}
          </p>
        </div>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-10 text-center text-xs font-bold text-gray-400">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400">Say hello — ask about pricing, freshness, or delivery.</p>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} isMine={m.sender_role === myRole} />)
        )}
        {peerTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-3.5 py-2.5 shadow-xs">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
            </div>
          </div>
        )}
      </div>

      {initialProduct && productAttached && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-emerald-100 bg-[#EAF7EE] px-3 py-2 text-[11px] font-semibold text-[#15803d]">
          Asking about: {initialProduct.name}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-100 bg-white p-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); notifyTyping(); }}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-full border border-gray-200 bg-[#F6F7F9] px-4 py-2.5 text-sm outline-none focus:border-[#16A34A]"
        />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#073729] text-white disabled:opacity-50">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
