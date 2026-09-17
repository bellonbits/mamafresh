"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCheck } from "lucide-react";
import ChatAvatar from "@/components/chat/ChatAvatar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChatThreads } from "@/lib/hooks/useChatThreads";
import { timeAgo } from "@/lib/utils";

interface ProductContext {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface Props {
  myUserId: string;
  selectedThreadId?: string;
  initialProduct?: ProductContext;
  initialMessage?: string;
}

export default function CustomerMessagesShell({ myUserId, selectedThreadId, initialProduct, initialMessage }: Props) {
  const router = useRouter();
  const { threads, loading } = useChatThreads({ role: "customer", filterId: myUserId });
  const [search, setSearch] = useState("");

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.peerName.toLowerCase().includes(q) || t.last_message.toLowerCase().includes(q));
  }, [threads, search]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="flex h-[min(640px,75vh)] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(7,55,41,0.08)]">
        {/* Recent Messages */}
        <aside
          className={
            selectedThreadId
              ? "hidden shrink-0 flex-col overflow-hidden border-r border-gray-100 md:flex md:w-72 lg:w-80"
              : "flex w-full shrink-0 flex-col overflow-hidden border-r border-gray-100 md:w-72 lg:w-80"
          }
        >
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
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-gray-700">No conversations yet</p>
                <p className="mt-1 text-xs text-gray-400">Chat with a seller from any product page to get started.</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = t.id === selectedThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/messages/${t.id}`)}
                    className={`flex w-full items-center gap-3 border-b border-gray-50 p-3.5 text-left transition-colors hover:bg-gray-50 ${active ? "bg-[#EAF7EE]" : ""}`}
                  >
                    <ChatAvatar name={t.peerName} avatarUrl={t.peerAvatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-gray-900">{t.peerName}</p>
                        <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(t.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-gray-500">{t.last_sender_role === "customer" ? "You: " : ""}{t.last_message || "Say hello"}</p>
                        {t.unread > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#16A34A] px-1.5 text-[10px] font-bold text-white">{t.unread}</span>
                        ) : t.last_sender_role === "customer" ? (
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
        <main
          className={
            selectedThreadId
              ? "flex min-w-0 flex-1 flex-col overflow-hidden"
              : "hidden min-w-0 flex-1 flex-col overflow-hidden md:flex"
          }
        >
          {selectedThread ? (
            <ChatWindow
              threadId={selectedThread.id}
              myUserId={myUserId}
              myRole="customer"
              peerName={selectedThread.peerName}
              peerAvatar={selectedThread.peerAvatar}
              backHref="/messages"
              fullScreen={false}
              initialProduct={initialProduct}
              initialMessage={initialMessage}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
              Select a conversation to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
