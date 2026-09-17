"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Star,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SellerRow, SellerStats, SellerStatus } from "@/lib/supabase/types";

type SellerWithStats = SellerRow & { stats?: SellerStats };

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Exclude<SellerStatus, "draft">>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      // Draft rows are unsubmitted onboarding in progress — not a vendor's
      // concern yet, so they're excluded from the moderation queue.
      const [{ data: sellerRows }, { data: statRows }] = await Promise.all([
        supabase.from("sellers").select("*").neq("status", "draft").order("created_at", { ascending: false }),
        supabase.from("seller_stats").select("*"),
      ]);
      if (!active) return;
      const statsById = new Map((statRows ?? []).map((s) => [s.seller_id, s as SellerStats]));
      setSellers((sellerRows ?? []).map((s) => ({ ...(s as SellerRow), stats: statsById.get(s.id) })));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const handleAction = async (sellerId: string, action: "approved" | "suspended" | "rejected") => {
    const { error } = await getSupabaseBrowserClient().from("sellers").update({ status: action }).eq("id", sellerId);
    if (error) {
      setToast(error.message);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setSellers((prev) => prev.map((s) => (s.id === sellerId ? { ...s, status: action } : s)));
    setToast(`Vendor status updated to ${action.toUpperCase()}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleDelete = async (seller: SellerWithStats) => {
    if (!confirm(`Permanently delete "${seller.name}"? This also deletes all of their product listings and cannot be undone.`)) return;
    const { error } = await getSupabaseBrowserClient().from("sellers").delete().eq("id", seller.id);
    if (error) {
      setToast(error.code === "23503" ? "This seller has order history and can't be deleted — suspend them instead to preserve records." : error.message);
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setSellers((prev) => prev.filter((s) => s.id !== seller.id));
    setToast(`${seller.name} deleted.`);
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = sellers.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.location.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mama Mboga Vendors</h1>
          <p className="text-xs text-gray-500">Approve, moderate, and verify neighborhood grocery stalls</p>
        </div>
        <Link
          href="/seller/register"
          className="px-4 py-2 rounded-xl bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={14} />
          <span>Onboard New Vendor</span>
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-[#DCFCE7] border border-[#B6E2BA] text-[#15803d] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by stall name or location..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "pending", "approved", "suspended", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all",
                statusFilter === st
                  ? "bg-[#073729] text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="p-3.5">Vendor / Stall</th>
                <th className="p-3.5">Area / Location</th>
                <th className="p-3.5">Completed Orders</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400 font-bold">Loading vendors...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400 font-bold">No vendors found</td></tr>
              )}
              {filtered.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-3.5">
                    <div>
                      <p className="font-extrabold text-gray-900 text-sm">{seller.name}</p>
                      <p className="text-[11px] text-gray-400">{seller.phone}</p>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-gray-600">
                    {seller.estate ? `${seller.estate}, ` : ""}{seller.location}
                  </td>
                  <td className="p-3.5 font-bold text-gray-900">
                    {seller.stats?.total_orders ?? 0} orders
                  </td>
                  <td className="p-3.5 font-bold text-amber-500">
                    <span className="flex items-center gap-1">
                      <Star size={13} fill="currentColor" /> {seller.stats?.rating ?? 0}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase",
                        seller.status === "approved" && "bg-[#DCFCE7] text-[#15803d]",
                        seller.status === "pending" && "bg-amber-100 text-amber-700",
                        (seller.status === "suspended" || seller.status === "rejected") && "bg-red-100 text-red-600"
                      )}
                    >
                      {seller.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {seller.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(seller.id, "approved")}
                            className="px-3 py-1 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(seller.id, "rejected")}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {seller.status === "approved" && (
                        <button
                          onClick={() => handleAction(seller.id, "suspended")}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Suspend
                        </button>
                      )}

                      {(seller.status === "suspended" || seller.status === "rejected") && (
                        <button
                          onClick={() => handleAction(seller.id, "approved")}
                          className="px-2.5 py-1 bg-[#DCFCE7] text-[#15803d] rounded-lg text-[11px] font-bold hover:bg-[#bbf7d0] transition-colors"
                        >
                          Reactivate
                        </button>
                      )}

                      <Link
                        href={`/shops/${seller.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="View Public Storefront"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      <button
                        onClick={() => void handleDelete(seller)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Seller"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
