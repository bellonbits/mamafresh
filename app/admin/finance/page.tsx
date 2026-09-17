"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, RotateCcw, CheckCircle2, Pencil, Lock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import type { MarketplaceSettingsRow } from "@/lib/supabase/types";

interface OrderFinance {
  id: string;
  total: number;
  status: string;
  refund_amount: number;
  created_at: string;
  sellers: { name: string } | null;
}

export default function AdminFinancePage() {
  const { adminRole, loading: roleLoading } = useIsAdmin();
  const [orders, setOrders] = useState<OrderFinance[]>([]);
  const [settings, setSettings] = useState<MarketplaceSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("10");

  const load = async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const supabase = getSupabaseBrowserClient();
    const [{ data: orderRows }, { data: settingsRow }] = await Promise.all([
      supabase.from("orders").select("id, total, status, refund_amount, created_at, sellers(name)").gte("created_at", todayStart.toISOString()).order("created_at", { ascending: false }),
      supabase.from("marketplace_settings").select("*").maybeSingle(),
    ]);
    setOrders((orderRows ?? []) as unknown as OrderFinance[]);
    if (settingsRow) {
      setSettings(settingsRow as MarketplaceSettingsRow);
      setRateInput(String(Math.round(settingsRow.commission_rate * 1000) / 10));
    }
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const commissionRate = settings?.commission_rate ?? 0.1;
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const grossSales = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const commission = grossSales * commissionRate;
  const refunds = orders.reduce((sum, o) => sum + o.refund_amount, 0);
  const sellerEarnings = grossSales - commission - refunds;

  const saveRate = async () => {
    const rate = Number(rateInput) / 100;
    if (Number.isNaN(rate) || rate < 0 || rate > 1) { notify("Enter a commission rate between 0 and 100."); return; }
    const { error } = await getSupabaseBrowserClient().from("marketplace_settings").update({ commission_rate: rate, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) { notify(error.message); return; }
    setSettings((current) => (current ? { ...current, commission_rate: rate } : current));
    setEditingRate(false);
    notify("Commission rate updated.");
  };

  const refundOrder = async (order: OrderFinance) => {
    const input = prompt(`Refund amount for order #${order.id.slice(0, 8).toUpperCase()} (max KSh ${order.total.toLocaleString()}):`, String(order.total));
    if (!input) return;
    const amount = Number(input);
    if (Number.isNaN(amount) || amount <= 0 || amount > order.total) { notify("Enter a valid refund amount."); return; }
    const { error } = await getSupabaseBrowserClient().from("orders").update({ refund_amount: amount, refunded_at: new Date().toISOString() }).eq("id", order.id);
    if (error) { notify(error.message); return; }
    setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, refund_amount: amount } : o)));
    notify(`KSh ${amount.toLocaleString()} refund recorded.`);
  };

  // Admins with no sub-role assigned keep legacy full access; once a role is assigned,
  // only Super Admin / Finance Admin may view financial data — matching the spec's
  // "Support Agent shouldn't access... financial configuration" example.
  const canViewFinance = !adminRole || adminRole === "super_admin" || adminRole === "finance_admin";

  if (!roleLoading && !canViewFinance) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <Lock className="text-gray-300" size={28} />
        <p className="text-sm font-bold text-gray-700">Restricted to Finance</p>
        <p className="max-w-xs text-xs text-gray-400">Your admin role doesn&apos;t include financial data. Ask a Super Admin for the Finance Admin role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finance</h1>
        <p className="text-xs text-gray-500">Today&apos;s marketplace economics, computed from real orders</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><TrendingUp size={13} /> Gross Sales</span>
              <p className="mt-2 text-xl font-black text-[#073729]">KSh {grossSales.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><Wallet size={13} /> Commission</span>
                <button onClick={() => setEditingRate((v) => !v)} aria-label="Edit commission rate" className="text-gray-400 hover:text-gray-600"><Pencil size={11} /></button>
              </div>
              <p className="mt-2 text-xl font-black text-gray-900">KSh {commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              {editingRate ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input value={rateInput} onChange={(e) => setRateInput(e.target.value)} type="number" min={0} max={100} className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-[10px]" />
                  <span className="text-[10px] text-gray-400">%</span>
                  <button onClick={() => void saveRate()} className="text-[10px] font-bold text-[#16A34A] hover:underline">Save</button>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">{(commissionRate * 100).toFixed(1)}% rate</p>
              )}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><Wallet size={13} /> Seller Earnings</span>
              <p className="mt-2 text-xl font-black text-[#16A34A]">KSh {sellerEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><RotateCcw size={13} /> Refunds</span>
              <p className="mt-2 text-xl font-black text-red-600">KSh {refunds.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 p-4">
              <h2 className="text-sm font-extrabold text-gray-900">Today&apos;s Transactions</h2>
            </div>
            {orders.length === 0 ? (
              <p className="p-8 text-center text-xs font-bold text-gray-400">No orders today yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 p-3.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">#{o.id.slice(0, 8).toUpperCase()} · {o.sellers?.name ?? "—"}</p>
                      <p className="text-gray-400">{new Date(o.created_at).toLocaleTimeString()} · {o.status}</p>
                    </div>
                    <span className="font-bold text-gray-900">KSh {o.total.toLocaleString()}</span>
                    {o.refund_amount > 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">Refunded KSh {o.refund_amount.toLocaleString()}</span>
                    ) : (
                      <button onClick={() => void refundOrder(o)} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100">Refund</button>
                    )}
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
