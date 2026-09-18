
import { useState } from "react";
import Link from "@/lib/next-compat/link";
import Image from "@/lib/next-compat/image";
import { usePathname } from "@/lib/next-compat/navigation";
import { Send, X, Sparkles } from "lucide-react";
import { useAssistantChat } from "@/lib/hooks/useAssistantChat";
import ShoppingListCard from "@/components/ShoppingListCard";

export default function Assistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sending, conflictNotice, send, addToCart, addAllToCart } = useAssistantChat(
    "Hi, I'm MamaFresh AI. Tell me what you're cooking or shopping for and I'll build a real shopping list from what's in stock."
  );

  // Hide on pages with their own fixed bottom action bar to avoid overlapping it
  if (
    pathname === "/assistant" ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/seller/messages") ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/products/")
  ) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(input);
    setInput("");
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && <section className="mb-3 flex h-[min(34rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-[#073729] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/10"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="24px" /></div>
            <span className="text-sm font-bold">MamaFresh AI</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/assistant" aria-label="Open full MamaFresh AI page" className="rounded-full p-1.5 hover:bg-white/10"><Sparkles size={15} /></Link>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-1.5 hover:bg-white/10"><X size={18} /></button>
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-2">
              <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-[#DCFCE7] text-[#073729]" : "bg-gray-100 text-gray-700"}`}>{message.content}</div>
              {message.items && message.items.length > 0 && (
                <ShoppingListCard items={message.items} onAdd={addToCart} onAddAll={addAllToCart} />
              )}
            </div>
          ))}
          {conflictNotice && <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700">{conflictNotice}</p>}
          {sending && <div className="max-w-[60%] rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-400">Thinking...</div>}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-gray-100 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. groceries for 2 days" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#16A34A]" /><button disabled={sending} aria-label="Send message" className="rounded-xl bg-[#073729] px-3 text-white disabled:opacity-50"><Send size={16} /></button></form>
      </section>}
      <button onClick={() => setOpen((value) => !value)} aria-label="Open MamaFresh AI" className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#073729] text-white shadow-lg transition-transform hover:scale-105">
        <Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="56px" />
      </button>
    </div>
  );
}
