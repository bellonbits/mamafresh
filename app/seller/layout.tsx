"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  Package,
  TrendingUp,
  Settings,
  Sparkles,
  Search,
  Bell,
  Plus,
  Box,
  Home,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { useChatThreads } from "@/lib/hooks/useChatThreads";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow } from "@/lib/supabase/types";

const SELLER_NAV_ITEMS = [
  { href: "/seller",           label: "Dashboard",   icon: LayoutGrid },
  { href: "/seller/orders",    label: "Orders",      icon: ClipboardList },
  { href: "/seller/products",  label: "Products",    icon: Package },
  { href: "/seller/sales",     label: "Sales",       icon: TrendingUp },
  { href: "/seller/assistant", label: "MamaFresh AI", icon: Sparkles },
];

const PAGE_TITLES: Record<string, string> = {
  "/seller": "Dashboard",
  "/seller/orders": "Orders",
  "/seller/products": "Products",
  "/seller/sales": "Sales",
  "/seller/assistant": "MamaFresh AI",
  "/seller/settings": "Settings",
};

function pageTitleFor(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((p) => p !== "/seller" && pathname.startsWith(p));
  return match ? PAGE_TITLES[match] : "Dashboard";
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const { threads: messageThreads } = useChatThreads({ role: "seller", filterId: seller?.id ?? null });
  const [activeOrders, setActiveOrders] = useState<(OrderRow & { profiles: { full_name: string } | null })[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");

  const unreadMessages = messageThreads.reduce((sum, t) => sum + t.unread, 0);
  const isOnboarding = pathname === "/seller/register";

  useEffect(() => {
    if (!seller) return;
    let active = true;
    void getSupabaseBrowserClient()
      .from("orders")
      .select("*, profiles(full_name)")
      .eq("seller_id", seller.id)
      .in("status", ["pending", "accepted", "preparing"])
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (active) setActiveOrders((data ?? []) as (OrderRow & { profiles: { full_name: string } | null })[]);
      });
    return () => { active = false; };
  }, [seller]);

  useEffect(() => {
    if (isOnboarding || sellerLoading || seller) return;
    // No approved shop tied to this account — this portal isn't theirs to browse.
    router.replace("/seller/register");
  }, [isOnboarding, sellerLoading, seller, router]);

  if (isOnboarding) return <>{children}</>;

  if (sellerLoading || !seller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9]">
        <p className="text-xs font-bold text-gray-400">{sellerLoading ? "Checking access..." : "Redirecting..."}</p>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/seller/products?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased text-gray-900 pb-20 md:pb-0">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-gray-100 bg-[#FAFBFC] md:flex">
        <Link href="/seller" className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#073729] text-white"><Box size={16} /></div>
          <span className="text-sm font-black tracking-tight text-gray-900">MamaFresh</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {SELLER_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/seller" ? pathname === "/seller" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active ? "bg-white text-[#073729] shadow-sm" : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                )}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <Link
            href="/seller/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
              pathname === "/seller/settings" ? "bg-white text-[#073729] shadow-sm" : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
            )}
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
          <Link href="/home" className="mt-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-500">
            <span aria-hidden="true">↪</span>
            <span>Exit to Marketplace</span>
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 bg-[#0B3D2E] px-4 py-3 text-white shadow-sm md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href="/home" aria-label="Back to home" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Home size={15} />
          </Link>
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-black text-sm shadow-xs">
            {seller?.name.slice(0, 1) ?? "M"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-extrabold leading-tight">{seller?.name ?? "Your shop"}</span>
              <span className={cn("w-2 h-2 shrink-0 rounded-full", seller?.is_open ? "bg-[#4ADE80] animate-pulse" : "bg-gray-400")} />
            </div>
            <p className="text-[10px] text-emerald-200">Seller Dashboard {seller ? `| ${seller.is_open ? "Open" : "Closed"}` : ""}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href="/seller/messages" aria-label="Messages" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <MessageCircle size={15} />
            {unreadMessages > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{unreadMessages}</span>}
          </Link>
          {seller && (
            <Link href={`/shops/${seller.slug}`} className="text-[11px] font-bold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full text-emerald-200 transition-colors">
              Preview Shop &gt;
            </Link>
          )}
        </div>
      </header>

      {/* Desktop top bar */}
      <div className="hidden md:block md:pl-60">
        <div className="flex items-center gap-4 border-b border-gray-100 bg-white px-8 py-4">
          <h1 className="shrink-0 text-xl font-black text-gray-900">{pageTitleFor(pathname)}</h1>
          <form onSubmit={handleSearch} className="mx-auto flex h-10 w-full max-w-md items-center gap-2 rounded-full border border-gray-200 bg-[#F6F7F9] px-4">
            <Search size={15} className="shrink-0 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
          </form>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/seller/messages" aria-label="Messages" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F7F9] text-gray-600 hover:bg-gray-100">
              <MessageCircle size={16} />
              {unreadMessages > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{unreadMessages}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setShowNotifications((v) => !v)} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F7F9] text-gray-600 hover:bg-gray-100">
                <Bell size={16} />
                {activeOrders.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{activeOrders.length}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                  <p className="mb-2 text-xs font-black text-gray-900">Active orders</p>
                  {activeOrders.length === 0 ? (
                    <p className="py-2 text-center text-xs text-gray-400">No active orders right now.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeOrders.map((order) => (
                        <Link key={order.id} href="/seller/orders" onClick={() => setShowNotifications(false)} className="block rounded-xl bg-gray-50 px-3 py-2 text-xs hover:bg-gray-100">
                          <p className="font-bold text-gray-800">{order.profiles?.full_name || "Customer"} · {order.status}</p>
                          <p className="text-[10px] text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link href="/seller/products/new" className="flex h-10 items-center gap-1.5 rounded-full bg-[#073729] px-4 text-xs font-bold text-white hover:bg-[#0B3D2E]">
              <Plus size={14} /> Add Product
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#84CC16] text-xs font-black text-[#073729]">
              {(seller?.name ?? "M").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="min-h-screen w-full bg-[#F6F7F9] md:pl-60">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-gray-200 bg-white px-2 py-1 shadow-lg md:hidden">
        {[...SELLER_NAV_ITEMS, { href: "/seller/settings", label: "Settings", icon: Settings }].map(({ href, label, icon: Icon }) => {
          const active = href === "/seller" ? pathname === "/seller" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors", active ? "text-[#0B3D2E] font-black" : "text-gray-400 hover:text-gray-600 font-medium")}>
              <div className={cn("p-1 rounded-full transition-all", active ? "bg-[#DCFCE7] text-[#15803d]" : "")}>
                <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[9px] leading-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
