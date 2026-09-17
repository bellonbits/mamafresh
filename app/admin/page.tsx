"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  PackageX,
  Flag,
  ChevronRight,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AdminAssistantCard from "@/components/AdminAssistantCard";
import type { OrderRow } from "@/lib/supabase/types";

interface DashboardStats {
  todayGmv: number;
  yesterdayGmv: number;
  ordersToday: number;
  activeCustomers: number;
  activeSellers: number;
  pendingSellers: number;
  completedRate: string;
  weeklyBars: { date: string; gmv: number }[];
  recentOrders: (OrderRow & { sellers: { name: string } | null; profiles: { full_name: string } | null })[];
  openComplaints: number;
  outOfStockProducts: number;
  reportedReviews: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const [
        { data: orders },
        { count: customerCount },
        { count: activeSellerCount },
        { count: pendingSellerCount },
        { data: recentOrders },
        { count: openComplaintCount },
        { count: outOfStockCount },
        { data: reportRows },
      ] = await Promise.all([
        supabase.from("orders").select("total,status,created_at").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("sellers").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*, sellers(name), profiles(full_name)").order("created_at", { ascending: false }).limit(8),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("products").select("id", { count: "exact", head: true }).or("stock_quantity.eq.0,is_available.eq.false"),
        supabase.from("review_reports").select("review_id"),
      ]);
      if (!active) return;

      const reportedReviews = new Set((reportRows ?? []).map((r) => r.review_id)).size;

      const rows = (orders ?? []) as Pick<OrderRow, "total" | "status" | "created_at">[];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const todayRows = rows.filter((o) => new Date(o.created_at) >= todayStart);
      const yesterdayRows = rows.filter((o) => new Date(o.created_at) >= yesterdayStart && new Date(o.created_at) < todayStart);
      const todayGmv = todayRows.reduce((sum, o) => sum + o.total, 0);
      const yesterdayGmv = yesterdayRows.reduce((sum, o) => sum + o.total, 0);
      const delivered = rows.filter((o) => o.status === "delivered").length;
      const nonCancelled = rows.filter((o) => o.status !== "cancelled").length;
      const completedRate = nonCancelled > 0 ? `${((delivered / nonCancelled) * 100).toFixed(1)}%` : "—";

      const weeklyBars = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(sevenDaysAgo);
        day.setDate(day.getDate() + i);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const gmv = rows.filter((o) => {
          const created = new Date(o.created_at);
          return created >= day && created < dayEnd;
        }).reduce((sum, o) => sum + o.total, 0);
        return { date: DAY_LABELS[day.getDay()], gmv };
      });

      setStats({
        todayGmv,
        yesterdayGmv,
        ordersToday: todayRows.length,
        activeCustomers: customerCount ?? 0,
        activeSellers: activeSellerCount ?? 0,
        pendingSellers: pendingSellerCount ?? 0,
        completedRate,
        weeklyBars,
        recentOrders: (recentOrders ?? []) as DashboardStats["recentOrders"],
        openComplaints: openComplaintCount ?? 0,
        outOfStockProducts: outOfStockCount ?? 0,
        reportedReviews,
      });
    };
    void load();
    return () => { active = false; };
  }, []);

  const gmvChange = stats && stats.yesterdayGmv > 0
    ? (((stats.todayGmv - stats.yesterdayGmv) / stats.yesterdayGmv) * 100).toFixed(1)
    : null;
  const maxBar = stats ? Math.max(1, ...stats.weeklyBars.map((b) => b.gmv)) : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Overview</h1>
          <p className="text-xs text-gray-500">Live operational performance and neighborhood metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803d] text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            Nairobi Cluster: Online
          </span>
        </div>
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
      <>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Today&apos;s GMV</span>
            <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#15803d] flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-[#073729] mt-2">
            KSh {stats.todayGmv.toLocaleString()}
          </p>
          {gmvChange !== null && (
            <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> {gmvChange}% vs yesterday
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Orders Today</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-2">{stats.ordersToday}</p>
          <span className="text-[10px] text-gray-400 mt-1 block">{stats.completedRate} fulfillment rate (7d)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Customers</span>
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-2">
            {stats.activeCustomers.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Active Sellers</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-2">{stats.activeSellers}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending Review</span>
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-amber-700 mt-2">{stats.pendingSellers}</p>
          <Link href="/admin/sellers" className="text-[10px] text-amber-800 font-bold hover:underline mt-1 block">
            Review vendor stalls &gt;
          </Link>
        </div>
      </div>

      {/* Needs Attention */}
      {(stats.pendingSellers > 0 || stats.openComplaints > 0 || stats.outOfStockProducts > 0 || stats.reportedReviews > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900">Needs Attention</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.pendingSellers > 0 && (
              <Link href="/admin/sellers" className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock size={15} /></span>
                  <span className="text-xs font-bold text-gray-800">{stats.pendingSellers} seller application{stats.pendingSellers === 1 ? "" : "s"} awaiting review</span>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </Link>
            )}
            {stats.openComplaints > 0 && (
              <Link href="/admin/complaints" className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={15} /></span>
                  <span className="text-xs font-bold text-gray-800">{stats.openComplaints} open complaint{stats.openComplaints === 1 ? "" : "s"}</span>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </Link>
            )}
            {stats.outOfStockProducts > 0 && (
              <Link href="/admin/products" className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600"><PackageX size={15} /></span>
                  <span className="text-xs font-bold text-gray-800">{stats.outOfStockProducts} out-of-stock product{stats.outOfStockProducts === 1 ? "" : "s"}</span>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </Link>
            )}
            {stats.reportedReviews > 0 && (
              <Link href="/admin/reviews" className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600"><Flag size={15} /></span>
                  <span className="text-xs font-bold text-gray-800">{stats.reportedReviews} reported review{stats.reportedReviews === 1 ? "" : "s"}</span>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </Link>
            )}
          </div>
        </div>
      )}

      <AdminAssistantCard />

      {/* Revenue Performance Chart Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Gross Merchandise Value (GMV)</h2>
            <p className="text-xs text-gray-400">Past 7 days across Nairobi neighborhood stalls</p>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-6">
          {stats.weeklyBars.map((bar) => (
            <div key={bar.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-[#073729]">KSh {bar.gmv.toLocaleString()}</span>
              <div
                style={{ height: `${Math.max(4, (bar.gmv / maxBar) * 100)}%` }}
                className="w-full bg-[#073729] hover:bg-[#16A34A] rounded-t-lg transition-colors cursor-pointer"
              />
              <span className="text-[10px] font-bold text-gray-400">{bar.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Marketplace Orders Monitor */}
      <div className="min-w-0 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Live Orders Pipeline</h2>
            <p className="text-xs text-gray-400">Most recent neighborhood requests</p>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold text-[#16A34A] hover:underline">
            View all orders &gt;
          </Link>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No orders yet</td></tr>
              )}
              {stats.recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 font-extrabold text-[#073729]">#{ord.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3 font-medium text-gray-800">{ord.sellers?.name ?? "—"}</td>
                  <td className="p-3 text-gray-600">{ord.profiles?.full_name || "Customer"}</td>
                  <td className="p-3 font-bold text-gray-900">KSh {ord.total.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#DCFCE7] text-[#15803d]">
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="text-[#16A34A] font-bold hover:underline"
                    >
                      Inspect &gt;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
