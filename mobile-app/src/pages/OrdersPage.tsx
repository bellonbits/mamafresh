
import { useEffect, useState } from "react";
import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { ArrowRight, Clock, Package } from "lucide-react";
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

type OrderItemWithProduct = OrderItemRow & { products: { image_url: string } | null };
type OrderWithRelations = OrderRow & { order_items: OrderItemWithProduct[]; sellers: { name: string } | null };

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
        .select("*, order_items(*, products(image_url)), sellers(name)")
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

          <div className="mb-6 flex gap-6 overflow-x-auto border-b border-gray-200">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative whitespace-nowrap pb-3 text-sm font-bold transition-colors",
                  activeTab === tab.key ? "text-[#073729]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#16A34A]" />
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const firstItem = order.order_items[0];
                const extraCount = order.order_items.length - 1;
                return (
                  <div key={order.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EAF7EE]">
                      {firstItem?.products?.image_url ? (
                        <Image src={firstItem.products.image_url} alt={firstItem.product_name} fill className="object-contain p-2" sizes="64px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300"><Package size={24} /></div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900">Transaction ID: <span className="font-black">{order.id.slice(0, 8).toUpperCase()}</span></p>
                      <p className="mt-0.5 text-[11px] text-gray-400">Placed: {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {firstItem ? `${firstItem.quantity}x ${firstItem.product_name}` : ""}{extraCount > 0 ? ` +${extraCount} more` : ""}
                      </p>
                      <p className="mt-1 text-sm font-black text-[#073729]">KSh {order.total.toLocaleString("en-KE")}</p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase",
                        order.status === "delivered" && "bg-lime-100 text-lime-700",
                        order.status === "cancelled" && "bg-red-100 text-red-700",
                        IN_PROGRESS_STATUSES.includes(order.status) && "bg-amber-100 text-amber-700"
                      )}>
                        {getStatusLabel(order.status)}
                      </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-1 rounded-full bg-[#073729] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0B3D2E]"
                      >
                        Track Order <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
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
