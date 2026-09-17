"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow, OrderItemRow } from "@/lib/supabase/types";

type OrderWithRelations = OrderRow & { order_items: OrderItemRow[]; sellers: { name: string } | null; profiles: { full_name: string; phone: string } | null };

export default function AdminOrdersPage() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("orders")
      .select("*, order_items(*), sellers(name), profiles(full_name, phone)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) {
          setOrders((data ?? []) as unknown as OrderWithRelations[]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      (o.sellers?.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (o.profiles?.full_name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Orders Pipeline</h1>
          <p className="text-xs text-gray-500">Live oversight of all transactions across East Africa</p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs">
          {orders.length} Orders Monitored
        </span>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order number, mama mboga, or customer..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="min-w-0 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="p-3.5">Order</th>
                <th className="p-3.5">Seller (Mama Mboga)</th>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Receipt / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={8} className="p-6 text-center text-gray-400 font-bold">Loading orders...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-gray-400 font-bold">No orders found</td></tr>
              )}
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-3.5 font-black text-[#073729]">#{ord.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3.5 font-semibold text-gray-800">{ord.sellers?.name ?? "—"}</td>
                  <td className="p-3.5">
                    <div>
                      <p className="font-bold text-gray-800">{ord.profiles?.full_name || "Customer"}</p>
                      <p className="text-[10px] text-gray-400">{ord.customer_phone || ord.profiles?.phone}</p>
                    </div>
                  </td>
                  <td className="p-3.5 text-gray-600">
                    <p className="line-clamp-1">{ord.order_items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}</p>
                  </td>
                  <td className="p-3.5 font-black text-gray-900">
                    KSh {ord.total.toLocaleString("en-KE")}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-[#16A34A]">
                      {ord.payment_method}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase",
                        ord.status === "pending" && "bg-amber-100 text-amber-700",
                        ord.status === "accepted" && "bg-blue-100 text-blue-700",
                        ord.status === "preparing" && "bg-purple-100 text-purple-700",
                        (ord.status === "ready" || ord.status === "out_for_delivery") && "bg-emerald-100 text-emerald-700",
                        ord.status === "delivered" && "bg-gray-100 text-gray-600",
                        ord.status === "cancelled" && "bg-red-100 text-red-600"
                      )}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#073729] font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Track</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
