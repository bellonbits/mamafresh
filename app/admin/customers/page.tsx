"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Ban, CheckCircle2, X, ShoppingBag, AlertTriangle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface CustomerProfile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  is_blocked: boolean;
  created_at: string;
}

interface CustomerDetail {
  orders: { id: string; total: number; status: string; created_at: string }[];
  complaints: { id: string; subject: string; status: string }[];
  reviews: { id: string; rating: number; comment: string }[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "blocked" | "new">("all");
  const [selected, setSelected] = useState<CustomerProfile | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("profiles")
      .select("id, full_name, phone, avatar_url, is_blocked, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) { setCustomers((data ?? []) as CustomerProfile[]); setLoading(false); }
      });
    return () => { active = false; };
  }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const openDetail = async (customer: CustomerProfile) => {
    setSelected(customer);
    setDetailLoading(true);
    const supabase = getSupabaseBrowserClient();
    const [{ data: orders }, { data: complaints }, { data: reviews }] = await Promise.all([
      supabase.from("orders").select("id, total, status, created_at").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("complaints").select("id, subject, status").eq("customer_id", customer.id),
      supabase.from("reviews").select("id, rating, comment").eq("user_id", customer.id),
    ]);
    setDetail({
      orders: (orders ?? []) as CustomerDetail["orders"],
      complaints: (complaints ?? []) as CustomerDetail["complaints"],
      reviews: (reviews ?? []) as CustomerDetail["reviews"],
    });
    setDetailLoading(false);
  };

  const toggleBlocked = async (customer: CustomerProfile) => {
    const { error } = await getSupabaseBrowserClient().from("profiles").update({ is_blocked: !customer.is_blocked }).eq("id", customer.id);
    if (error) { notify(error.message); return; }
    setCustomers((current) => current.map((c) => (c.id === customer.id ? { ...c, is_blocked: !c.is_blocked } : c)));
    if (selected?.id === customer.id) setSelected({ ...customer, is_blocked: !customer.is_blocked });
    notify(customer.is_blocked ? "Customer unblocked." : "Customer blocked — they can no longer place orders.");
  };

  const [newCutoffIso, setNewCutoffIso] = useState<string | null>(null);
  useEffect(() => {
    queueMicrotask(() => setNewCutoffIso(new Date(Date.now() - SEVEN_DAYS_MS).toISOString()));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q && !c.full_name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      if (tab === "active") return !c.is_blocked;
      if (tab === "blocked") return c.is_blocked;
      if (tab === "new") return !!newCutoffIso && c.created_at > newCutoffIso;
      return true;
    });
  }, [customers, search, tab, newCutoffIso]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customers</h1>
        <p className="text-xs text-gray-500">{customers.length.toLocaleString()} customers on the marketplace</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "active", "blocked", "new"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-3.5 py-2 text-xs font-bold capitalize transition-colors", tab === t ? "bg-[#073729] text-white" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50")}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone..." className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-[#16A34A]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-xs font-bold text-gray-400">No customers found.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <button onClick={() => void openDetail(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-xs font-black text-[#15803d]">
                    {(c.full_name || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{c.full_name || "Unnamed customer"}</p>
                    <p className="text-xs text-gray-400">{c.phone || "No phone"} · Joined {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </button>
                {c.is_blocked && <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Blocked</span>}
                <button
                  onClick={() => void toggleBlocked(c)}
                  className={cn("flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold", c.is_blocked ? "bg-[#DCFCE7] text-[#15803d] hover:bg-[#bbf7d0]" : "bg-red-50 text-red-600 hover:bg-red-100")}
                >
                  {c.is_blocked ? <CheckCircle2 size={11} /> : <Ban size={11} />} {c.is_blocked ? "Unblock" : "Block"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">{selected.full_name || "Unnamed customer"}</h2>
                <p className="text-xs text-gray-400">{selected.phone || "No phone on file"}</p>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); }} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            {detailLoading || !detail ? (
              <p className="py-6 text-center text-xs font-bold text-gray-400">Loading...</p>
            ) : (
              <div className="max-h-96 space-y-4 overflow-y-auto">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-gray-700"><ShoppingBag size={13} /> Recent orders ({detail.orders.length})</p>
                  {detail.orders.length === 0 ? <p className="text-xs text-gray-400">No orders yet.</p> : (
                    <div className="space-y-1.5">
                      {detail.orders.map((o) => (
                        <div key={o.id} className="flex justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                          <span className="font-semibold text-gray-700">#{o.id.slice(0, 8).toUpperCase()} · {o.status}</span>
                          <span className="font-bold text-gray-900">KSh {o.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-gray-700"><AlertTriangle size={13} /> Complaints ({detail.complaints.length})</p>
                  {detail.complaints.length === 0 ? <p className="text-xs text-gray-400">None filed.</p> : (
                    <div className="space-y-1.5">
                      {detail.complaints.map((c) => <div key={c.id} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700">{c.subject} · {c.status}</div>)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-gray-700"><Star size={13} /> Reviews ({detail.reviews.length})</p>
                  {detail.reviews.length === 0 ? <p className="text-xs text-gray-400">None written.</p> : (
                    <div className="space-y-1.5">
                      {detail.reviews.map((r) => <div key={r.id} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">{"★".repeat(r.rating)} {r.comment}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => void toggleBlocked(selected)}
              className={cn("w-full rounded-xl py-2.5 text-xs font-black", selected.is_blocked ? "bg-[#073729] text-white" : "bg-red-50 text-red-600")}
            >
              {selected.is_blocked ? "Unblock customer" : "Block customer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
