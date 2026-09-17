"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award } from "lucide-react";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatKSh } from "@/lib/utils";

interface TopProduct {
  name: string;
  quantity: number;
  unit: string;
  revenue: number;
  share: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SellerSalesAnalyticsPage() {
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [todaySales, setTodaySales] = useState(0);
  const [weekSales, setWeekSales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [dailyBars, setDailyBars] = useState<{ day: string; amount: number }[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!seller) {
        if (active) setLoading(false);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("id,total,created_at,order_items(product_name,quantity,unit_price)")
        .eq("seller_id", seller.id)
        .gte("created_at", monthStart.toISOString())
        .neq("status", "cancelled");
      if (!active) return;

      const rows = orders ?? [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const monthTotal = rows.reduce((sum, o) => sum + o.total, 0);
      const weekTotal = rows.filter((o) => new Date(o.created_at) >= weekStart).reduce((sum, o) => sum + o.total, 0);
      const todayTotal = rows.filter((o) => new Date(o.created_at) >= todayStart).reduce((sum, o) => sum + o.total, 0);

      const bars = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const amount = rows.filter((o) => {
          const created = new Date(o.created_at);
          return created >= day && created < dayEnd;
        }).reduce((sum, o) => sum + o.total, 0);
        return { day: DAY_LABELS[day.getDay()], amount };
      });

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      for (const order of rows) {
        for (const item of (order.order_items ?? []) as { product_name: string; quantity: number; unit_price: number }[]) {
          const entry = productMap.get(item.product_name) ?? { quantity: 0, revenue: 0 };
          entry.quantity += item.quantity;
          entry.revenue += item.quantity * item.unit_price;
          productMap.set(item.product_name, entry);
        }
      }
      const maxRevenue = Math.max(1, ...Array.from(productMap.values()).map((v) => v.revenue));
      const top = Array.from(productMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([name, v]) => ({ name, quantity: v.quantity, unit: "sold", revenue: v.revenue, share: Math.round((v.revenue / maxRevenue) * 100) }));

      if (!active) return;
      setTodaySales(todayTotal);
      setWeekSales(weekTotal);
      setMonthSales(monthTotal);
      setDailyBars(bars);
      setTopProducts(top);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [seller]);

  const maxBar = Math.max(1, ...dailyBars.map((b) => b.amount));

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
    <div className="p-4 space-y-4 animate-fade-in pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-[#0B3D2E]">Earnings & Sales</h1>
        <p className="text-xs text-gray-500">Track your income this month</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
      <>
      {/* 3 Periods Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Today</span>
          <p className="text-sm font-black text-[#0B3D2E] mt-1">{formatKSh(todaySales)}</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">This Week</span>
          <p className="text-sm font-black text-[#0B3D2E] mt-1">{formatKSh(weekSales)}</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">This Month</span>
          <p className="text-sm font-black text-[#0B3D2E] mt-1">{formatKSh(monthSales)}</p>
        </div>
      </div>

      {/* Weekly Revenue Bar Chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h2 className="text-xs font-extrabold text-[#0B3D2E] uppercase tracking-wider mb-3">
          Daily Revenue (Past 7 Days)
        </h2>

        <div className="h-32 flex items-end justify-between gap-2 pt-4">
          {dailyBars.map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                style={{ height: `${Math.max(4, (bar.amount / maxBar) * 100)}%` }}
                className="w-full bg-[#16A34A] rounded-t-lg hover:bg-[#15803d] transition-all"
                title={formatKSh(bar.amount)}
              />
              <span className="text-[10px] font-bold text-gray-500">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center gap-1.5 mb-3 text-[#0B3D2E]">
          <Award size={16} />
          <h2 className="text-xs font-extrabold uppercase tracking-wider">Top Selling Items</h2>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No sales yet this month.</p>
        ) : (
        <div className="space-y-3">
          {topProducts.map((p) => (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-800">{p.name}</span>
                  <span className="text-[10px] text-gray-400 ml-2">({p.quantity} {p.unit})</span>
                </div>
                <span className="font-extrabold text-[#0B3D2E]">{formatKSh(p.revenue)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div style={{ width: `${p.share}%` }} className="h-full bg-[#84CC16] rounded-full" />
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
