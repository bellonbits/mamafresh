"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import CustomerSidebar from "@/components/CustomerSidebar";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow, OrderItemRow } from "@/lib/supabase/types";

const ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In Progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type OrderTab = (typeof ORDER_TABS)[number]["key"];

const IN_PROGRESS_STATUSES: OrderRow["status"][] = ["pending", "accepted", "preparing", "ready", "out_for_delivery"];

const getStatusLabel = (status: OrderRow["status"]) => {
  if (IN_PROGRESS_STATUSES.includes(status)) return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

type OrderWithRelations = OrderRow & { order_items: OrderItemRow[]; sellers: { name: string } | null };

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), sellers(name)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (active) {
        setOrders((data ?? []) as unknown as OrderWithRelations[]);
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "in-progress") return IN_PROGRESS_STATUSES.includes(order.status);
    return order.status === activeTab;
  });

  return (
    <div className="animate-fade-in px-4 sm:px-8 lg:px-12 pt-8 pb-28">
      <div className="mx-auto flex max-w-7xl items-start gap-6">
        <CustomerSidebar />
        <main className="min-w-0 flex-1">
          <div className="mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-[#073729]">My Orders</h1>
              <p className="mt-1 text-xs text-gray-500">Track current and past grocery orders</p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                  activeTab === tab.key
                    ? "border-[#073729] bg-[#073729] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#073729] hover:text-[#073729]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-gray-900">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase",
                          order.status === "delivered" && "bg-lime-100 text-lime-700",
                          order.status === "cancelled" && "bg-red-100 text-red-700",
                          IN_PROGRESS_STATUSES.includes(order.status) && "bg-amber-100 text-amber-700"
                        )}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                      <p className="mt-3 text-sm text-gray-700">
                        {order.order_items.map((item) => `${item.quantity}x ${item.product_name}`).join(" | ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#16A34A]">{order.sellers?.name ?? "MamaFresh seller"}</p>
                    </div>
                    <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
                      <p className="text-base font-black text-[#073729]">KSh {order.total.toLocaleString("en-KE")}</p>
                      <ChevronRight size={18} className="text-[#073729]" />
                    </div>
                  </div>
                </Link>
              ))}
              {filteredOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
                  <Clock size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No orders found</p>
                  <p className="mt-1 text-xs text-gray-400">Orders in this status will appear here.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
