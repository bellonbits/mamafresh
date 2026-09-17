"use client";

import { useEffect, useState } from "react";
import { Star, Flag, Trash2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReviewRow } from "@/lib/supabase/types";

type ReviewWithProduct = ReviewRow & { products: { name: string } | null; reportCount: number };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "reported">("reported");
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const [{ data: reviewRows }, { data: reportRows }] = await Promise.all([
      supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false }),
      supabase.from("review_reports").select("review_id"),
    ]);
    const counts = new Map<string, number>();
    for (const r of reportRows ?? []) counts.set(r.review_id, (counts.get(r.review_id) ?? 0) + 1);
    const withCounts = ((reviewRows ?? []) as unknown as (ReviewRow & { products: { name: string } | null })[]).map((r) => ({
      ...r,
      reportCount: counts.get(r.id) ?? 0,
    }));
    setReviews(withCounts);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const dismissReports = async (reviewId: string) => {
    const { error } = await getSupabaseBrowserClient().from("review_reports").delete().eq("review_id", reviewId);
    if (error) { notify(error.message); return; }
    setReviews((current) => current.map((r) => (r.id === reviewId ? { ...r, reportCount: 0 } : r)));
    notify("Reports dismissed — review kept up.");
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Remove this review permanently?")) return;
    const { error } = await getSupabaseBrowserClient().from("reviews").delete().eq("id", reviewId);
    if (error) { notify(error.message); return; }
    setReviews((current) => current.filter((r) => r.id !== reviewId));
    notify("Review removed.");
  };

  const filtered = filter === "reported" ? reviews.filter((r) => r.reportCount > 0) : reviews;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reviews</h1>
        <p className="text-xs text-gray-500">Moderate reported reviews — negative reviews alone are never auto-removed</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setFilter("reported")} className={cn("rounded-full px-3.5 py-2 text-xs font-bold transition-colors", filter === "reported" ? "bg-[#073729] text-white" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50")}>
          Reported ({reviews.filter((r) => r.reportCount > 0).length})
        </button>
        <button onClick={() => setFilter("all")} className={cn("rounded-full px-3.5 py-2 text-xs font-bold transition-colors", filter === "all" ? "bg-[#073729] text-white" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50")}>
          All reviews ({reviews.length})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck className="mx-auto text-gray-300" size={28} />
            <p className="mt-2 text-sm font-bold text-gray-700">Nothing to review</p>
            <p className="mt-1 text-xs text-gray-400">{filter === "reported" ? "No reviews have been reported." : "No reviews yet."}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{r.author_name}</span>
                      <span className="text-[10px] text-gray-400">on</span>
                      <span className="text-xs font-semibold text-[#16A34A]">{r.products?.name ?? "a product"}</span>
                      {r.reportCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          <Flag size={10} /> {r.reportCount} report{r.reportCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="my-1 flex gap-0.5 text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">{r.comment}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {r.reportCount > 0 && (
                      <button onClick={() => void dismissReports(r.id)} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100">
                        Dismiss reports
                      </button>
                    )}
                    <button onClick={() => void deleteReview(r.id)} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100">
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
