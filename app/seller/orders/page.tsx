"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import SellerOrderCard from "@/components/SellerOrderCard";
import type { OrderRow, OrderItemRow, OrderStatus } from "@/lib/supabase/types";

type OrderWithItems = OrderRow & { order_items: OrderItemRow[]; profiles: { full_name: string } | null };

const ORDER_TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "New" },
  { key: "accepted",  label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready",     label: "Ready" },
  { key: "delivered", label: "Completed" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: "accepted", label: "Accept Order" },
  accepted: { next: "preparing", label: "Start Preparing (Packing)" },
  preparing: { next: "ready", label: "Mark Ready for Pickup / Rider" },
  ready: { next: "out_for_delivery", label: "Mark Out for Delivery" },
  out_for_delivery: { next: "delivered", label: "Mark Completed (Handed Over)" },
};

export default function SellerOrdersManager() {
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!seller) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const client = getSupabaseBrowserClient();
    let active = true;

    void client
      .from("orders")
      .select("*, order_items(*), profiles(full_name)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) {
          setOrders((data ?? []) as unknown as OrderWithItems[]);
          setLoading(false);
        }
      });

    const channel = client
      .channel(`seller-orders-${seller.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `seller_id=eq.${seller.id}` }, async (payload) => {
        const orderId = (payload.new as { id: string }).id;
        const { data } = await client.from("orders").select("*, order_items(*), profiles(full_name)").eq("id", orderId).maybeSingle();
        if (data) {
          setOrders((current) => [data as unknown as OrderWithItems, ...current]);
          setToast("New customer order received");
          setTimeout(() => setToast(null), 2500);
        }
      })
      .subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [seller]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    const { error } = await getSupabaseBrowserClient().from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      setToast(error.message);
    } else {
      setToast(`Order updated to ${newStatus.toUpperCase()}`);
    }
    setTimeout(() => setToast(null), 2000);
  };

  const displayedOrders =
    activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  if (sellerLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">You don&apos;t have a shop yet</p>
        <Link href="/seller/register" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Register your shop</Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[#0B3D2E]">Customer Orders</h1>
          <p className="text-xs text-gray-500">Manage orders and update delivery status</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803d] text-xs font-bold">
          {orders.length} total
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
        {ORDER_TABS.map((tab) => {
          const count =
            tab.key === "all" ? orders.length : orders.filter((o) => o.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95",
                activeTab === tab.key
                  ? "bg-[#0B3D2E] text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0B3D2E] text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce-in">
          <CheckCircle2 size={15} className="text-[#4ADE80]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Order Cards */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
      ) : (
      <div className="grid gap-3 lg:grid-cols-2">
        {displayedOrders.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
            <Clock size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No orders in this stage</p>
            <p className="text-xs text-gray-400 mt-1">New incoming customer orders will appear here.</p>
          </div>
        ) : (
          displayedOrders.map((ord) => (
            <SellerOrderCard key={ord.id} order={ord} action={NEXT_STATUS[ord.status]} onUpdateStatus={handleUpdateStatus} />
          ))
        )}
      </div>
      )}
    </div>
  );
}
