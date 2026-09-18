"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/mock-data";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import SellerCard from "@/components/SellerCard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, SellerRow } from "@/lib/supabase/types";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      if (!trimmed) {
        setProducts([]);
        setSellers([]);
        return;
      }
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const term = `%${trimmed}%`;
      const [productsRes, sellersRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_available", true).or(`name.ilike.${term},category.ilike.${term},seller_name.ilike.${term}`).limit(24),
        supabase.from("sellers").select("*").or(`name.ilike.${term},location.ilike.${term},estate.ilike.${term}`).limit(12),
      ]);
      setProducts((productsRes.data ?? []) as ProductRow[]);
      setSellers((sellersRes.data ?? []) as SellerRow[]);
      setLoading(false);
    }, trimmed ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = products.length > 0 || sellers.length > 0;

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Search header */}
      <div className="header-green px-4 py-3 sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-3 py-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              id="search-input"
              type="search"
              autoFocus
              placeholder='Search "tomatoes, avocado..."'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-4">
        {/* Initial state */}
        {!query && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Popular searches</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Tomatoes", "Avocado", "Sukuma wiki", "Onions", "Carrots", "Mangoes"].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-gray-200 hover:border-brand-400 hover:text-brand-700 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Browse by category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-2.5 p-3 bg-white rounded-xl shadow-card"
                >
                  <CategoryIcon slug={cat.slug} size={36} />
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && !loading && !hasResults && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <SearchX size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No results for &quot;{query}&quot;</p>
            <p className="text-xs text-gray-400 mt-1">Try searching for something else</p>
          </div>
        )}

        {query && loading && (
          <div className="py-20 text-center text-sm text-gray-400">Searching...</div>
        )}

        {query && sellers.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Sellers ({sellers.length})</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sellers.map((s) => (
                <SellerCard key={s.id} seller={s} />
              ))}
            </div>
          </div>
        )}

        {query && products.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              Products ({products.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
