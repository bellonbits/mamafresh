import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { useRouter } from "@/lib/next-compat/navigation";
import { ChevronLeft, ChevronRight, Navigation, PackageOpen } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { cn, formatKSh } from "@/lib/utils";
import type { OrderRow } from "@/lib/supabase/types";

const ACTIVE_STATUSES: OrderRow["status"][] = ["accepted", "preparing", "ready", "out_for_delivery"];

export default function DeliveriesPage() {
  const router = useRouter();
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sellerLoading || !seller) { setLoading(false); return; }
    let active = true;
    void getSupabaseBrowserClient()
      .from("orders")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("order_type", "delivery")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) { setOrders((data ?? []) as OrderRow[]); setLoading(false); }
      });
    return () => { active = false; };
  }, [seller, sellerLoading]);

  return (
    <div className="min-h-screen bg-[#FFFDF7] pb-28 animate-fade-in">
      <header className="px-4 py-3 flex items-center gap-3 sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-xs border-b border-gray-100">
        <button onClick={() => router.back()} aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-black text-[#073729]">My Deliveries</h1>
          <p className="text-[11px] text-gray-400">Share your live location while out delivering</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        {sellerLoading || loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : !seller ? (
          <div className="py-16 text-center">
            <PackageOpen size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">This account isn&apos;t registered as a seller</p>
            <p className="mt-1 text-xs text-gray-400">Only registered sellers can share a live delivery location.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No active deliveries</p>
            <p className="mt-1 text-xs text-gray-400">Orders you need to deliver will show up here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/deliver/${order.id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#16A34A]">
                <Navigation size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">{order.delivery_address}</p>
                <p className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", order.status === "out_for_delivery" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600")}>
                  {order.status.replace(/_/g, " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-[#073729]">{formatKSh(order.total)}</p>
                {order.seller_lat != null && <p className="mt-1 text-[10px] font-bold text-[#16A34A]">Sharing</p>}
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
