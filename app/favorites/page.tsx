"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, ShoppingCart, ArrowRight } from "lucide-react";
import CustomerSidebar from "@/components/CustomerSidebar";
import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useFavorites } from "@/lib/hooks/useFavorites";
import type { ProductRow } from "@/lib/supabase/types";

const FAVORITE_CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "fruits", label: "Fruits" },
  { id: "vegetables", label: "Vegetables" },
  { id: "roots-tubers", label: "Roots & Tubers" },
];

export default function FavoritesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);
  const { favoriteIds, isSignedIn, loading: favoritesLoading } = useFavorites();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favoritesLoading) return;
    let active = true;
    const load = async () => {
      const ids = Array.from(favoriteIds);
      if (ids.length === 0) {
        if (active) { setProducts([]); setLoading(false); }
        return;
      }
      const { data } = await getSupabaseBrowserClient().from("products").select("*").in("id", ids);
      if (active) {
        setProducts((data ?? []) as ProductRow[]);
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [favoriteIds, favoritesLoading]);

  const favoriteProducts = products.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category_slug === selectedCategory;
  });
  const visibleProducts = favoriteProducts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#FFFDF7] pb-32 animate-fade-in">
      {/* Top Header */}
      <header className="px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-xs border-b border-gray-100">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#073729]">My Favorites</h1>
          <p className="text-xs text-gray-400">{favoriteProducts.length} saved items</p>
        </div>
        <Link
          href="/cart"
          aria-label="Cart"
          className="w-9 h-9 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ShoppingCart size={16} />
        </Link>
      </header>

      <div className="mx-auto flex max-w-7xl items-start gap-6 px-4 sm:px-8 lg:px-12">
        <CustomerSidebar />
        <div className="min-w-0 flex-1">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
            {FAVORITE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                    isSelected
                      ? "bg-[#073729] text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 2-Column Product Grid */}
          <main className="pt-2">
        {!isSignedIn && !favoritesLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
              <Heart size={28} />
            </div>
            <h2 className="text-base font-bold text-gray-900">Sign in to see your favorites</h2>
            <p className="text-xs text-gray-400">Favorites saved with the heart icon appear here.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#073729] text-white text-xs font-bold shadow-sm"
            >
              <span>Sign in</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : loading || favoritesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
              <Heart size={28} />
            </div>
            <h2 className="text-base font-bold text-gray-900">No favorites in this category</h2>
            <p className="text-xs text-gray-400">Save items using the heart icon while browsing.</p>
            <Link
              href="/home"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#073729] text-white text-xs font-bold shadow-sm"
            >
              <span>Explore Produce</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {visibleCount < favoriteProducts.length && (
          <div className="flex justify-center pt-10">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 8)}
              className="rounded-full border border-[#073729] px-8 py-3 text-xs font-bold text-[#073729] transition-colors hover:bg-[#073729] hover:text-white"
            >
              Load More
            </button>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
