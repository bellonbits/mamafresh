
import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { Check, Filter, MapPin, Search, Star, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDeliveryLocation } from "@/lib/hooks/useDeliveryLocation";
import type { ProductRow, SellerRow } from "@/lib/supabase/types";

const PRICE_OPTIONS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under KSh 50", min: 0, max: 50 },
  { label: "KSh 50 - KSh 150", min: 50, max: 150 },
  { label: "Over KSh 150", min: 150, max: Infinity },
];

export default function ShopsDirectoryPage() {
  const { location } = useDeliveryLocation();
  const [query, setQuery] = useState("");
  const [sellerId, setSellerId] = useState("All");
  const [category, setCategory] = useState("All");
  const [priceIndex, setPriceIndex] = useState(0);
  const [minimumRating, setMinimumRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const price = PRICE_OPTIONS[priceIndex];
  const categories = ["All", ...CATEGORIES.map((item) => item.name)];

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from("products").select("*").eq("is_available", true),
      supabase.from("sellers").select("*").eq("status", "approved"),
    ]).then(([productsRes, sellersRes]) => {
      if (!active) return;
      setAllProducts((productsRes.data ?? []) as ProductRow[]);
      setSellers((sellersRes.data ?? []) as SellerRow[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const filteredProducts = allProducts.filter((product) => {
    const matchesSeller = sellerId === "All" || product.seller_id === sellerId;
    const matchesQuery = `${product.name} ${product.category} ${product.seller_name}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || product.category === category;
    const matchesPrice = product.price >= price.min && product.price <= price.max;
    const matchesRating = (product.rating || 0) >= minimumRating;
    return matchesSeller && matchesQuery && matchesCategory && matchesPrice && matchesRating && (!inStockOnly || product.is_available);
  }).sort((first, second) => {
    if (sort === "price-low") return first.price - second.price;
    if (sort === "price-high") return second.price - first.price;
    if (sort === "rating") return (second.rating || 0) - (first.rating || 0);
    return Number(second.is_featured) - Number(first.is_featured);
  });

  const activeFilters = [
    category !== "All" ? category : null,
    sellerId !== "All" ? sellers.find((seller) => seller.id === sellerId)?.name : null,
    priceIndex !== 0 ? price.label : null,
    minimumRating ? `${minimumRating}+ Stars` : null,
    inStockOnly ? "In Stock" : null,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setCategory("All");
    setSellerId("All");
    setPriceIndex(0);
    setMinimumRating(0);
    setInStockOnly(false);
  };

  return (
    <div className="bg-[#F1F3F3] animate-fade-in">
      <header className="bg-[#073729] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Fresh marketplace</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Shop all products</h1>
              <p className="mt-1 text-xs text-emerald-100/75">Fresh groceries from trusted neighborhood sellers.</p>
            </div>
            <Link href="/location" className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-emerald-100 sm:flex"><MapPin size={13} /> {location.split(",")[0]}</Link>
          </div>
          <label className="flex h-12 w-full items-center gap-2 rounded-full bg-white px-4 text-gray-400 shadow-sm">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fresh vegetables, fruits, or sellers" className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setSellerId("All")} className={cn("shrink-0 rounded-full px-4 py-2 text-xs font-bold", sellerId === "All" ? "bg-[#B8EF4A] text-[#073729]" : "bg-white/10 text-white")}>All shops</button>
            {sellers.map((seller) => <Link key={seller.id} href={`/shops/${seller.slug}`} onClick={(event) => { event.preventDefault(); setSellerId(seller.id); }} className={cn("shrink-0 rounded-full px-4 py-2 text-xs font-bold", sellerId === seller.id ? "bg-[#B8EF4A] text-[#073729]" : "bg-white/10 text-white")}>{seller.name}</Link>)}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl lg:rounded-3xl">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-bold text-gray-900">Everyday essentials</p><p className="mt-1 text-xs text-gray-500">Showing {filteredProducts.length} of {allProducts.length} products</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setFiltersOpen(!filtersOpen)} className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 px-4 text-xs font-bold text-gray-700 md:hidden"><Filter size={14} /> Filters</button>
              <label className="flex h-10 items-center gap-2 rounded-full border border-gray-200 px-3 text-xs text-gray-500">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent font-bold text-gray-800 outline-none"><option value="featured">Featured</option><option value="rating">Top rated</option><option value="price-low">Price low</option><option value="price-high">Price high</option></select></label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            <aside className={cn("w-full shrink-0 border-b border-gray-100 p-4 sm:p-6 md:block md:w-64 md:border-b-0 md:border-r", filtersOpen ? "block" : "hidden")}>
              <div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-gray-900">Filter options</h2><button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="md:hidden"><X size={18} /></button></div>
              <fieldset className="border-t border-gray-100 pt-4"><legend className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">Category</legend><div className="space-y-2">{categories.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"><input type="radio" name="all-category" checked={category === item} onChange={() => setCategory(item)} className="accent-[#168255]" />{item}</label>)}</div></fieldset>
              <fieldset className="mt-6 border-t border-gray-100 pt-4"><legend className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">Price</legend><div className="space-y-2">{PRICE_OPTIONS.map((item, index) => <label key={item.label} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"><input type="radio" name="all-price" checked={priceIndex === index} onChange={() => setPriceIndex(index)} className="accent-[#168255]" />{item.label}</label>)}</div></fieldset>
              <fieldset className="mt-6 border-t border-gray-100 pt-4"><legend className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">Review</legend><div className="space-y-2">{[5, 4, 3].map((rating) => <label key={rating} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"><input type="radio" name="all-rating" checked={minimumRating === rating} onChange={() => setMinimumRating(rating)} className="accent-[#168255]" /><span className="flex text-[#F5B916]">{Array.from({ length: rating }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</span><span>{rating}+ stars</span></label>)}</div></fieldset>
              <label className="mt-6 flex cursor-pointer items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-600"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="accent-[#168255]" /> In stock only</label>
              <button onClick={clearFilters} className="mt-6 text-xs font-bold text-[#168255] underline">Clear all filters</button>
            </aside>

            <section className="min-w-0 flex-1 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"><span className="shrink-0 text-xs font-bold text-gray-500">Active filters:</span>{activeFilters.length === 0 ? <span className="text-xs text-gray-400">None</span> : activeFilters.map((filter) => <span key={filter} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F8C51C] px-3 py-1.5 text-xs font-bold text-gray-900">{filter}<Check size={12} /></span>)}{activeFilters.length > 0 && <button onClick={clearFilters} className="shrink-0 text-xs font-semibold text-[#168255] underline">Clear all</button>}</div>
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>
              ) : filteredProducts.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} className="min-w-0" />)}</div> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><Filter className="mb-3 text-gray-300" size={32} /><p className="font-bold text-gray-700">No products match these filters</p><button onClick={clearFilters} className="mt-3 text-sm font-bold text-[#168255] underline">Clear filters</button></div>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
