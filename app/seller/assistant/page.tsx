"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, TrendingUp, PackageSearch, Award } from "lucide-react";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { cn } from "@/lib/utils";
import { postAssistantMessage } from "@/lib/assistant/client";

type Message = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  { label: "Sales summary", icon: TrendingUp, prompt: "Give me a quick sales summary for this week." },
  { label: "Low stock", icon: PackageSearch, prompt: "What products am I low on stock for?" },
  { label: "Top products", icon: Award, prompt: "Which of my products sold best this month?" },
];

export default function SellerAssistantPage() {
  const { seller, loading } = useCurrentSeller();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

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

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">Finish setting up your shop first</p>
        <p className="text-sm text-gray-500">MamaFresh AI needs a shop to answer questions about.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col p-4 sm:p-6">
      {messages.length === 0 && (
        <div className="mb-6 text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border border-gray-100 shadow-sm">
            <Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="64px" />
          </div>
          <h1 className="mt-4 text-xl font-black text-gray-900">Ask MamaFresh AI about {seller.name}</h1>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500">Real answers from your shop&apos;s actual sales, stock, and product data — nothing made up.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {PROMPTS.map((p) => {
              const Icon = p.icon;
              return (
                <button key={p.label} onClick={() => void send(p.prompt)} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:border-[#16A34A] hover:text-[#16A34A]">
                  <Icon size={13} /> {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={cn("flex items-start gap-2.5", message.role === "user" && "flex-row-reverse")}>
            {message.role === "assistant" && (
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="28px" /></div>
            )}
            <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm", message.role === "user" ? "bg-[#073729] text-white" : "border border-gray-100 bg-white text-gray-800 shadow-xs")}>
              {message.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="28px" /></div>
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-2.5 text-sm text-gray-400 shadow-xs">Thinking...</div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mt-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pl-4 shadow-sm">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your sales, stock, or top products..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
