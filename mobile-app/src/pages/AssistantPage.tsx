
import { useEffect, useRef, useState } from "react";
import Link from "@/lib/next-compat/link";
import Image from "@/lib/next-compat/image";
import {
  Send,
  ChevronDown,
  MessageSquarePlus,
  Home,
  Store,
  ShoppingCart,
  ListChecks,
  ChefHat,
  Tag,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAssistantChat, type ChatMessage } from "@/lib/hooks/useAssistantChat";
import { useConversationHistory } from "@/lib/hooks/useConversationHistory";
import { useCartStore } from "@/lib/store/cart";
import { formatKSh, cn } from "@/lib/utils";
import ShoppingListCard from "@/components/ShoppingListCard";

const GREETING = "Hi, I'm MamaFresh AI. Describe a meal or what you need groceries for, and I'll put together a real shopping list from what's in stock right now.";

const QUICK_ACTIONS = [
  { label: "Build a shopping list", prompt: "Help me build a shopping list for the week." },
  { label: "Get a meal idea", prompt: "Give me a meal idea I can cook tonight with what's in stock." },
  { label: "Find today's deals", prompt: "What fresh produce is discounted right now?" },
];

const FEATURE_CARDS = [
  { icon: ListChecks, title: "Shopping List", badge: "Build List", desc: "Turn a plan into a real, in-stock grocery list.", prompt: "Build me a shopping list for 3 days of vegetables." },
  { icon: ChefHat, title: "Meal Ideas", badge: "Get Recipe", desc: "Tell me a dish, I'll find the ingredients nearby.", prompt: "What can I cook with tomatoes, onions and potatoes?" },
  { icon: Tag, title: "Best Deals", badge: "Find Offers", desc: "Discover discounted, fresh picks today.", prompt: "Show me the best discounted fresh produce right now." },
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sending, conflictNotice, send, addToCart, addAllToCart, startNewChat, loadConversation } = useAssistantChat(GREETING);
  const { conversations, isSignedIn, refresh: refreshHistory, loadMessages } = useConversationHistory();
  const { getTotalItems } = useCartStore();

  const hasConversation = messages.length > 1;
  const cartCount = getTotalItems();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    if (hasConversation) void refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollButton(el.scrollHeight - el.scrollTop - el.clientHeight >= 40);
  };

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    void send(input);
    setInput("");
  };

  const runPrompt = (prompt: string) => void send(prompt);

  const handleNewChat = () => {
    startNewChat(GREETING);
    setMobileSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleLoadConversation = async (id: string) => {
    const loaded = await loadMessages(id);
    loadConversation(id, loaded.length ? loaded : [{ role: "assistant", content: GREETING }]);
    setMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4">
        <Link href="/home" className="flex items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="28px" /></div>
          <span className="text-sm font-black text-white">MamaFresh AI</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="hidden rounded-full p-1.5 text-emerald-200/60 hover:bg-white/10 hover:text-white lg:block">
          <PanelLeftClose size={16} />
        </button>
      </div>
      <div className="px-4 pb-2">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15"
        >
          <MessageSquarePlus size={16} /> New Chat
        </button>
      </div>
      <nav className="px-4 pb-3 space-y-1 text-sm font-semibold text-emerald-100/80">
        <Link href="/home" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white"><Home size={16} /> Home</Link>
        <Link href="/shops" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white"><Store size={16} /> Browse Shops</Link>
        <Link href="/cart" className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white">
          <span className="flex items-center gap-2.5"><ShoppingCart size={16} /> Cart</span>
          {cartCount > 0 && <span className="rounded-full bg-[#84CC16] px-2 py-0.5 text-[10px] font-black text-[#073729]">{cartCount}</span>}
        </Link>
      </nav>
      <div className="flex-1 overflow-y-auto border-t border-white/10 px-4 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-200/50">History</p>
        {!isSignedIn ? (
          <p className="text-xs text-emerald-200/50">Sign in to save and revisit your chat history.</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-emerald-200/50">Your past conversations will appear here.</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => void handleLoadConversation(c.id)}
                className="block w-full truncate rounded-lg px-3 py-2 text-left text-xs font-semibold text-emerald-100/70 hover:bg-white/10 hover:text-white"
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#84CC16]/20 text-[#84CC16]"><Store size={16} /></div>
        <p className="text-xs font-black text-white">Sell on MamaFresh</p>
        <p className="mt-1 text-[11px] text-emerald-200/60">List your stall and reach neighborhood buyers.</p>
        <Link href="/seller/register" className="mt-3 block rounded-full bg-[#84CC16] px-3 py-2 text-[11px] font-black text-[#073729]">Get started</Link>
      </div>
    </>
  );

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#04140D] text-white">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#16A34A]/25 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#84CC16]/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#073729]/60 blur-[100px]" />
      </div>

      {/* Sidebar (desktop) */}
      {sidebarOpen && (
        <aside className="relative z-10 hidden w-72 shrink-0 flex-col border-r border-white/10 bg-white/[0.04] backdrop-blur-xl lg:flex">
          {sidebarContent}
        </aside>
      )}

      {/* Sidebar (mobile drawer) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative z-10 flex w-72 flex-col border-r border-white/10 bg-[#04140D] backdrop-blur-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" className="hidden rounded-full border border-white/10 bg-white/5 p-2 text-emerald-100/80 hover:text-white lg:block">
                <PanelLeftOpen size={16} />
              </button>
            )}
            <button onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu" className="rounded-full border border-white/10 bg-white/5 p-2 text-emerald-100/80 hover:text-white lg:hidden">
              <MessageSquarePlus size={16} />
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-emerald-100/80 sm:flex">
              <Sparkles size={12} /> MamaFresh AI
            </span>
          </div>
          <Link href="/cart" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-emerald-100/80 hover:text-white">
            <ShoppingCart size={14} /> Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
        </header>

        {!hasConversation ? (
          <main className="flex-1 overflow-y-auto px-4 pb-10 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              {/* Glowing avatar */}
              <div className="relative mx-auto mt-4 h-28 w-28">
                <div className="absolute inset-0 rounded-full bg-[#84CC16]/40 blur-2xl" />
                <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/20 shadow-2xl">
                  <Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="112px" priority />
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">Ready to Shop Something Fresh?</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-emerald-100/60">
                Describe a meal or what you need, and I&apos;ll build a real shopping list from MamaFresh sellers&apos; actual, in-stock produce.
              </p>

              {/* Quick actions */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => runPrompt(action.prompt)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-emerald-100/80 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <form onSubmit={submit} className="mx-auto mt-5 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 pl-4 shadow-2xl backdrop-blur-xl">
                <Sparkles size={16} className="shrink-0 text-[#84CC16]" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Anything..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-emerald-100/40"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#84CC16] text-[#073729] transition-transform hover:scale-105 disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>

              {/* Feature cards */}
              <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                {FEATURE_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={() => runPrompt(card.prompt)}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#84CC16]"><Icon size={17} /></div>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100/80">{card.badge}</span>
                      </div>
                      <p className="mt-3 text-sm font-black text-white">{card.title}</p>
                      <p className="mt-1 text-xs text-emerald-100/50">{card.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        ) : (
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
              <div className="mx-auto max-w-2xl space-y-5">
                {messages.map((message, index) => (
                  <ChatBubble key={`${message.role}-${index}`} message={message} onAdd={addToCart} onAddAll={addAllToCart} />
                ))}
                {conflictNotice && <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">{conflictNotice}</p>}
                {sending && (
                  <div className="flex items-start gap-2.5">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="28px" /></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-emerald-100/50">Thinking...</div>
                  </div>
                )}
              </div>
            </div>

            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                aria-label="Scroll to latest message"
                className="absolute bottom-24 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-md backdrop-blur hover:bg-white/20"
              >
                <ChevronDown size={16} />
              </button>
            )}

            <div className="px-4 py-4 sm:px-6 lg:px-10">
              <form onSubmit={submit} className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 pl-4 shadow-2xl backdrop-blur-xl">
                <Sparkles size={16} className="shrink-0 text-[#84CC16]" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask MamaFresh AI..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-emerald-100/40"
                />
                <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#84CC16] text-[#073729] disabled:opacity-40">
                  <Send size={16} />
                </button>
              </form>
              <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-emerald-100/30">MamaFresh AI only recommends real, in-stock products — it can still make mistakes, so double-check before ordering.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ message, onAdd, onAddAll }: { message: ChatMessage; onAdd: (item: NonNullable<ChatMessage["items"]>[number]) => void; onAddAll: (items: NonNullable<ChatMessage["items"]>) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#84CC16] px-4 py-2.5 text-sm font-medium text-[#073729]">{message.content}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="28px" /></div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm leading-relaxed text-emerald-50">{message.content}</div>
        {message.items && message.items.length > 0 && <ShoppingListCard items={message.items} onAdd={onAdd} onAddAll={onAddAll} />}
      </div>
    </div>
  );
}
