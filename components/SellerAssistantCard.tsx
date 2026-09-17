"use client";

import { useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { postAssistantMessage } from "@/lib/assistant/client";

type Message = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  { label: "Analyze sales", prompt: "Give me a quick sales summary for this week." },
  { label: "View low stock", prompt: "What products am I low on stock for?" },
  { label: "Top products", prompt: "Which of my products sold best this month?" },
];

export default function SellerAssistantCard({ sellerName }: { sellerName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    const result = await postAssistantMessage("/api/seller-assistant", { messages: next });
    setMessages((current) => [...current, { role: "assistant", content: result.content }]);
    setSending(false);
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-[#073729] px-4 py-3.5 text-white flex items-center gap-2">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#84CC16]"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="32px" /></div>
        <div>
          <p className="text-sm font-black">MamaFresh AI</p>
          <p className="text-[10px] text-emerald-200">{greeting}, {sellerName}.</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500">Ask about your sales, stock, or top products — I&apos;ll answer from your real shop data.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={cn("max-w-[90%] rounded-xl px-3 py-2 text-xs", message.role === "user" ? "ml-auto bg-[#DCFCE7] text-[#073729]" : "bg-gray-50 text-gray-700")}>
                {message.content}
              </div>
            ))}
            {sending && <div className="max-w-[60%] rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-400">Thinking...</div>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => void send(p.prompt)}
              disabled={sending}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-600 hover:border-[#16A34A] hover:text-[#16A34A] disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask MamaFresh AI about your shop..."
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
