"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, MapPin, CheckCheck } from "lucide-react";
import ChatAvatar from "@/components/chat/ChatAvatar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChatThreads } from "@/lib/hooks/useChatThreads";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatKSh, timeAgo } from "@/lib/utils";
import type { SellerRow } from "@/lib/supabase/types";

interface CustomerContext {
  phone: string;
  location: string;
  orders: { id: string; created_at: string; total: number; firstItem: string; itemCount: number }[];
}

interface Props {
  seller: SellerRow;
  myUserId: string;
  selectedThreadId?: string;
}

export default function SellerMessagesShell({ seller, myUserId, selectedThreadId }: Props) {
  const router = useRouter();
  const { threads, loading } = useChatThreads({ role: "seller", filterId: seller.id });
  const [search, setSearch] = useState("");
  const [context, setContext] = useState<CustomerContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.peerName.toLowerCase().includes(q) || t.last_message.toLowerCase().includes(q));
  }, [threads, search]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!selectedThread) { if (active) setContext(null); return; }
      setContextLoading(true);
      const supabase = getSupabaseBrowserClient();
      const [{ data: profile }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("phone").eq("id", selectedThread.customer_id).maybeSingle(),
        supabase
          .from("orders")
          .select("id, created_at, total, delivery_address, order_items(product_name)")
          .eq("customer_id", selectedThread.customer_id)
          .eq("seller_id", seller.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (!active) return;
      const orderRows = (orders ?? []) as { id: string; created_at: string; total: number; delivery_address: string; order_items: { product_name: string }[] }[];
      setContext({
        phone: profile?.phone || "Not provided",
        location: orderRows[0]?.delivery_address || "No orders yet",
        orders: orderRows.map((o) => ({
          id: o.id,
          created_at: o.created_at,
          total: o.total,
          firstItem: o.order_items[0]?.product_name ?? "Order",
          itemCount: o.order_items.length,
        })),
      });
      setContextLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [selectedThread?.id, selectedThread?.customer_id, seller.id]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden p-4 md:h-[calc(100vh-64px)] lg:p-6">
      {/* Recent Messages */}
      <aside className={cn("w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white md:flex md:w-72 lg:w-80", selectedThreadId ? "hidden md:flex" : "flex")}>
        <div className="border-b border-gray-100 p-4">
          <h2 className="mb-3 text-sm font-black text-gray-900">Recent Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here..."
              className="w-full rounded-full border border-gray-200 bg-[#F6F7F9] py-2 pl-8 pr-3 text-xs outline-none focus:border-[#16A34A]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-center text-xs font-bold text-gray-400">Loading...</p>
          ) : filteredThreads.length === 0 ? (
            <p className="p-6 text-center text-xs text-gray-400">No conversations yet.</p>
          ) : (
            filteredThreads.map((t) => {
              const active = t.id === selectedThreadId;
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/seller/messages/${t.id}`)}
                  className={cn("flex w-full items-center gap-3 border-b border-gray-50 p-3.5 text-left transition-colors hover:bg-gray-50", active && "bg-[#EAF7EE]")}
                >
                  <ChatAvatar name={t.peerName} avatarUrl={t.peerAvatar} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-gray-900">{t.peerName}</p>
                      <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(t.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-gray-500">{t.last_message || "Say hello"}</p>
                      {t.unread > 0 ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#E84919] px-1.5 text-[10px] font-bold text-white">{t.unread}</span>
                      ) : t.last_sender_role === "seller" ? (
                        <CheckCheck size={14} className="shrink-0 text-[#2563EB]" />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Conversation */}
      <main className={cn("min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white", !selectedThreadId && "hidden md:flex")}>
        {selectedThread ? (
          <ChatWindow
            threadId={selectedThread.id}
            myUserId={myUserId}
            myRole="seller"
            peerName={selectedThread.peerName}
            peerAvatar={selectedThread.peerAvatar}
            backHref="/seller/messages"
            fullScreen={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </main>

      {/* Customer info + orders */}
      {selectedThread && (
        <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 xl:flex">
          <div className="flex flex-col items-center text-center">
            <ChatAvatar name={selectedThread.peerName} avatarUrl={selectedThread.peerAvatar} size={80} />
            <p className="mt-3 text-base font-black text-gray-900">{selectedThread.peerName}</p>
            <p className="text-[11px] text-gray-400">Customer ID: {selectedThread.customer_id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-2">
              <Phone size={13} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Phone</p>
                <p className="text-xs font-semibold text-gray-800">{contextLoading ? "..." : context?.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                <p className="text-xs font-semibold text-gray-800">{contextLoading ? "..." : context?.location}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2.5 text-xs font-black text-gray-900">Orders with you</p>
            {contextLoading ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : !context || context.orders.length === 0 ? (
              <p className="text-xs text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {context.orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-2.5 rounded-xl bg-[#F6F7F9] p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[10px] font-black text-[#15803d]">
                      {new Date(o.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-gray-800">{o.firstItem}{o.itemCount > 1 ? ` +${o.itemCount - 1} more` : ""}</p>
                      <p className="text-[10px] text-gray-400">#{o.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#073729] shadow-xs">{formatKSh(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
