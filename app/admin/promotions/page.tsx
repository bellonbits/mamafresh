"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Power, CheckCircle2, X, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/useCategories";
import type { PromotionRow } from "@/lib/supabase/types";

export default function AdminPromotionsPage() {
  const { categories } = useCategories();
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("10");
  const [categorySlug, setCategorySlug] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient().from("promotions").select("*").order("created_at", { ascending: false });
    setPromotions((data ?? []) as PromotionRow[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleActive = async (promo: PromotionRow) => {
    const { error } = await getSupabaseBrowserClient().from("promotions").update({ is_active: !promo.is_active }).eq("id", promo.id);
    if (error) { notify(error.message); return; }
    setPromotions((current) => current.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p)));
    notify(promo.is_active ? "Promotion paused." : "Promotion activated.");
  };

  const deletePromotion = async (promo: PromotionRow) => {
    if (!confirm(`Delete "${promo.title}"?`)) return;
    const { error } = await getSupabaseBrowserClient().from("promotions").delete().eq("id", promo.id);
    if (error) { notify(error.message); return; }
    setPromotions((current) => current.filter((p) => p.id !== promo.id));
    notify("Promotion deleted.");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) return;
    setSaving(true);
    const { data, error } = await getSupabaseBrowserClient()
      .from("promotions")
      .insert({ title: title.trim(), discount_percent: Number(discount), category_slug: categorySlug || null, starts_at: startsAt, ends_at: endsAt })
      .select("*")
      .single();
    setSaving(false);
    if (error) { notify(error.message); return; }
    setPromotions((current) => [data as PromotionRow, ...current]);
    setCreating(false);
    setTitle(""); setDiscount("10"); setCategorySlug(""); setStartsAt(""); setEndsAt("");
    notify("Promotion created and live on the Offers page.");
  };

  const isRunning = (p: PromotionRow) => {
    const now = new Date();
    return p.is_active && new Date(p.starts_at) <= now && new Date(p.ends_at) >= now;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Promotions</h1>
          <p className="text-xs text-gray-500">Marketplace-wide campaigns shown on the Offers page</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-full bg-[#073729] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0B3D2E]">
          <Plus size={14} /> New promotion
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : promotions.length === 0 ? (
          <div className="p-10 text-center">
            <Megaphone className="mx-auto text-gray-300" size={28} />
            <p className="mt-2 text-sm font-bold text-gray-700">No promotions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {promotions.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{p.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isRunning(p) ? "bg-[#DCFCE7] text-[#15803d]" : "bg-gray-100 text-gray-500")}>
                      {isRunning(p) ? "Running" : p.is_active ? "Scheduled/Ended" : "Paused"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{p.discount_percent}% off {p.category_slug ? `· ${p.category_slug}` : "· all categories"} · {p.starts_at} to {p.ends_at}</p>
                </div>
                <button onClick={() => void toggleActive(p)} aria-label={p.is_active ? "Pause" : "Activate"} className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100"><Power size={14} /></button>
                <button onClick={() => void deletePromotion(p)} aria-label="Delete" className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreating(false)}>
          <form onSubmit={create} className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">New promotion</h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-700">Title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Fresh Deals" className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">Discount %<input required type="number" min={1} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">
              Category (optional)
              <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-bold text-gray-700">Starts<input required type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
              <label className="block text-xs font-bold text-gray-700">Ends<input required type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            </div>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#073729] py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Creating..." : "Create promotion"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
