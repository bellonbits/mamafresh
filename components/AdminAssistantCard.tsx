"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { postAssistantMessage } from "@/lib/assistant/client";

type Message = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Which sellers have not received an order this week?",
  "What are our top 20 products?",
  "Which area has the most orders?",
  "Show me products that are frequently out of stock.",
  "How much did we sell yesterday?",
  "Which sellers have the highest cancellation rate?",
];

export default function AdminAssistantCard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    const result = await postAssistantMessage("/api/admin-assistant", { messages: next });
    setMessages((current) => [...current, { role: "assistant", content: result.content }]);
    setSending(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="flex items-center gap-2 bg-[#073729] px-4 py-3.5 text-white">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#84CC16]"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="32px" /></div>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-black"><Sparkles size={13} /> MamaFresh AI</p>
          <p className="text-[10px] text-emerald-200">Ask about sales, sellers, products, or areas — grounded in real data</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500">Ask a real question about the marketplace and I&apos;ll query it live.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={cn("max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-xs", message.role === "user" ? "ml-auto bg-[#DCFCE7] text-[#073729]" : "bg-gray-50 text-gray-700")}>
                {message.content}
              </div>
            ))}
            {sending && <div className="max-w-[60%] rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-400">Querying marketplace data...</div>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => void send(p)} disabled={sending} className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-600 hover:border-[#16A34A] hover:text-[#16A34A] disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask MamaFresh AI about the marketplace..."
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#16A34A]"
          />
          <button disabled={sending || !input.trim()} aria-label="Send" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#073729] text-white disabled:opacity-50">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
