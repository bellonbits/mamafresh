"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2, CheckCircle2, ArrowUpDown, Box, PackageCheck, AlertTriangle, Sparkles, Star } from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, ReviewRow } from "@/lib/supabase/types";

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 6;
type Tab = "all" | "available" | "unavailable" | "low_stock" | "promoted";
type SortKey = "name" | "price_low" | "price_high" | "stock";

export default function SellerProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-gray-400">Loading...</div>}>
      <SellerProductsContent />
    </Suspense>
  );
}

function SellerProductsContent() {
  const searchParams = useSearchParams();
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [reviews, setReviews] = useState<(ReviewRow & { products: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setQuery(searchParams.get("q") ?? ""));
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!seller) {
        if (active) setLoading(false);
        return;
      }
      const [{ data: productData }, { data: reviewData }] = await Promise.all([
        getSupabaseBrowserClient().from("products").select("*").eq("seller_id", seller.id).order("name"),
        getSupabaseBrowserClient().from("reviews").select("*, products!inner(name, seller_id)").eq("products.seller_id", seller.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (active) {
        setProducts((productData ?? []) as ProductRow[]);
        setReviews((reviewData ?? []) as unknown as (ReviewRow & { products: { name: string } | null })[]);
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [seller]);

  const toggleAvailability = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextState = !target.is_available;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_available: nextState } : p)));
    setToast(`${target.name} marked ${nextState ? "Available" : "Unavailable"}`);
    setTimeout(() => setToast(null), 1800);
    const { error } = await getSupabaseBrowserClient().from("products").update({ is_available: nextState, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_available: !nextState } : p)));
      setToast(error.message);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleDelete = async (product: ProductRow) => {
    if (!confirm(`Remove ${product.name} from your shop? This can't be undone.`)) return;
    setDeletingId(product.id);
    const { error } = await getSupabaseBrowserClient().from("products").delete().eq("id", product.id);
    setDeletingId(null);
    if (error) {
      setToast(error.message);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setToast(`${product.name} removed`);
    setTimeout(() => setToast(null), 1800);
  };

  const filtered = useMemo(() => {
    let rows = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (tab === "available") rows = rows.filter((p) => p.is_available);
    if (tab === "unavailable") rows = rows.filter((p) => !p.is_available);
    if (tab === "low_stock") rows = rows.filter((p) => p.stock_quantity <= LOW_STOCK_THRESHOLD);
    if (tab === "promoted") rows = rows.filter((p) => p.is_featured);
    return [...rows].sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      if (sort === "stock") return b.stock_quantity - a.stock_quantity;
      return a.name.localeCompare(b.name);
    });
  }, [products, query, tab, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter((p) => p.is_available).length,
    lowStock: products.filter((p) => p.stock_quantity <= LOW_STOCK_THRESHOLD).length,
  }), [products]);

  const promoted = useMemo(() => products.filter((p) => p.is_featured).slice(0, 4), [products]);

  if (sellerLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">You don&apos;t have a shop yet</p>
        <Link href="/seller/register" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Register your shop</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 sm:p-6 lg:p-8">
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#0B3D2E] px-4 py-2 text-xs font-bold text-white shadow-xl animate-bounce-in">
          <CheckCircle2 size={15} className="text-[#4ADE80]" /> {toast}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Box} label="Total Products" value={stats.total} color="text-[#7C3AED] bg-[#F3E8FF]" />
            <StatCard icon={PackageCheck} label="Available" value={stats.available} color="text-[#16A34A] bg-[#DCFCE7]" />
            <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} color="text-amber-600 bg-amber-50" />
          </div>

          {/* Tabs + filter/sort */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1 overflow-x-auto text-sm font-bold">
                {([["all", "All Products"], ["available", "Available"], ["unavailable", "Unavailable"], ["low_stock", "Low Stock"]] as [Tab, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => { setTab(key); setPage(1); }} className={cn("shrink-0 rounded-full px-3.5 py-1.5 transition-colors", tab === key ? "bg-[#073729] text-white" : "text-gray-500 hover:bg-gray-50")}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex h-9 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-xs font-semibold text-gray-600">
                  <ArrowUpDown size={13} />
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-transparent outline-none">
                    <option value="name">Name</option>
                    <option value="price_low">Price: Low-High</option>
                    <option value="price_high">Price: High-Low</option>
                    <option value="stock">Stock</option>
                  </select>
                </label>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Filter by name..." className="h-9 w-32 rounded-full border border-gray-200 px-3 text-xs outline-none focus:border-[#16A34A] sm:w-40" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : pageRows.length === 0 ? (
              <p className="py-14 text-center text-sm text-gray-400">
                {products.length === 0 ? <>No products yet. <Link href="/seller/products/new" className="font-bold text-[#16A34A]">Add your first product</Link>.</> : "No products match this filter."}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-100 text-gray-400">
                      <tr>
                        <th className="p-4 font-bold">Product</th>
                        <th className="p-4 font-bold">Stock</th>
                        <th className="p-4 font-bold">Inventory</th>
                        <th className="p-4 font-bold">Price</th>
                        <th className="p-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pageRows.map((product) => {
                        const low = product.stock_quantity <= LOW_STOCK_THRESHOLD;
                        return (
                          <tr key={product.id} className="hover:bg-gray-50/60">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50"><Image src={product.image_url} alt={product.name} fill className="object-contain p-1" sizes="40px" /></div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
                                  <p className="text-[10px] text-gray-400">{product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <button onClick={() => void toggleAvailability(product.id)} className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase", !product.is_available ? "bg-red-50 text-red-600" : low ? "bg-amber-50 text-amber-700" : "bg-[#DCFCE7] text-[#15803d]")}>
                                {!product.is_available ? "Unavailable" : low ? "Low Stock" : "Available"}
                              </button>
                            </td>
                            <td className="p-4 font-bold text-gray-800">{product.stock_quantity} {product.unit}</td>
                            <td className="p-4 font-bold text-gray-900">{formatKSh(product.price)}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/seller/products/new?edit=${product.id}`} aria-label={`Edit ${product.name}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#073729]"><Pencil size={14} /></Link>
                                <button onClick={() => void handleDelete(product)} disabled={deletingId === product.id} aria-label={`Delete ${product.name}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 p-4 text-xs text-gray-500">
                  <span>Showing {(pageSafe - 1) * PAGE_SIZE + 1}-{Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length} products</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1} className="rounded-full border border-gray-200 px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages} className="rounded-full border border-gray-200 px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Link href="/seller/assistant" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-shadow hover:shadow-md">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"><Image src="/avatar.png" alt="MamaFresh AI" fill className="object-cover" sizes="40px" /></div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-sm font-black text-gray-900">MamaFresh AI <Sparkles size={12} className="text-[#84CC16]" /></p>
              <p className="text-[11px] text-gray-400">Ask about sales, stock, or top products</p>
            </div>
          </Link>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <p className="mb-3 text-sm font-black text-gray-900">Promoted Products</p>
            {promoted.length === 0 ? (
              <p className="text-xs text-gray-400">Feature a product from its edit page to promote it on the homepage.</p>
            ) : (
              <div className="space-y-2.5">
                {promoted.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50"><Image src={p.image_url} alt={p.name} fill className="object-contain p-0.5" sizes="36px" /></div>
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">{p.name}</p>
                    <p className="shrink-0 text-xs font-bold text-gray-900">{formatKSh(p.price)}</p>
                  </div>
                ))}
                <button onClick={() => { setTab("promoted"); setPage(1); }} className="text-[11px] font-bold text-[#16A34A] hover:underline">All Promoted Products</button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <p className="mb-3 text-sm font-black text-gray-900">Ratings and Reviews</p>
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="text-xs">
                    <p className="flex items-center gap-1 font-bold text-gray-800">
                      {r.author_name} <span className="font-normal text-gray-400">on {r.products?.name ?? "a product"}</span>
                    </p>
                    <div className="my-0.5 flex text-amber-400"><Star size={10} fill="currentColor" /><span className="ml-1 text-gray-500">{r.rating}/5</span></div>
                    <p className="text-gray-500">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", color)}><Icon size={15} /></div>
      </div>
      <p className="mt-2 text-2xl font-black text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}
