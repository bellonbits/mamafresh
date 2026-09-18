
import { useState, useEffect } from "react";
import Link from "@/lib/next-compat/link";
import { useRouter, useParams } from "@/lib/next-compat/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Filter,
  Heart,
  MapPin,
  Search,
  Share2,
  ShoppingCart,
  Star,
  X,
  Check,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatKSh } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, SellerRow, ReviewRow } from "@/lib/supabase/types";

const PRICE_OPTIONS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under KSh 50", min: 0, max: 50 },
  { label: "KSh 50 - KSh 150", min: 50, max: 150 },
  { label: "Over KSh 150", min: 150, max: Infinity },
];

interface TabItem {
  id: "Products" | "About" | "Reviews" | "FAQ";
  label: string;
  badge?: boolean;
}

const TABS: TabItem[] = [
  { id: "Products", label: "Products" },
  { id: "About", label: "About us" },
  { id: "Reviews", label: "Reviews", badge: true },
  { id: "FAQ", label: "FAQ" },
];

type TabId = TabItem["id"];

export default function SellerStorefrontPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [sellerProducts, setSellerProducts] = useState<ProductRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [priceIndex, setPriceIndex] = useState(0);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("Products");
  const [isFollowing, setIsFollowing] = useState(false);

  const { items } = useCartStore();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: sellerData } = await supabase.from("sellers").select("*").eq("slug", slug).maybeSingle();
      if (!active) return;
      if (!sellerData) {
        setNotFoundFlag(true);
        setLoading(false);
        return;
      }
      const s = sellerData as SellerRow;
      setSeller(s);
      const [{ data: productsData }, { data: reviewsData }] = await Promise.all([
        supabase.from("products").select("*").eq("seller_id", s.id),
        supabase.from("reviews").select("*, products!inner(seller_id)").eq("products.seller_id", s.id).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setSellerProducts((productsData ?? []) as ProductRow[]);
      setReviews((reviewsData ?? []) as ReviewRow[]);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [slug]);

  const categories = ["All", ...Array.from(new Set(sellerProducts.map((p) => p.category)))];
  const price = PRICE_OPTIONS[priceIndex];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const filteredProducts = sellerProducts
    .filter((p) => {
      const matchQ = `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase());
      const matchCat = category === "All" || p.category === category;
      const matchPrice = p.price >= price.min && p.price <= price.max;
      return matchQ && matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      return Number(b.is_featured) - Number(a.is_featured);
    });

  const cartCount = items
    .filter((i) => i.product.seller_id === seller?.id)
    .reduce((s, i) => s + i.quantity, 0);

  const activeFilters = [
    category !== "All" ? category : null,
    priceIndex !== 0 ? price.label : null,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setCategory("All");
    setPriceIndex(0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F5]">
        <div className="text-sm font-bold text-gray-400">Loading shop...</div>
      </div>
    );
  }

  if (notFoundFlag || !seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F4F6F5] p-6 text-center">
        <p className="text-lg font-black text-gray-800">Shop not found</p>
        <Link href="/shops" className="rounded-full bg-[#073729] px-5 py-2.5 text-xs font-bold text-white">Browse all shops</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] pb-24 animate-fade-in">
      {/* Centered container with uniform width and alignment */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-5">
        
        {/* ── CARD 1: STORE HEADER (ONE UNIFIED CARD, NO GAPS) ── */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          
          {/* Banner */}
          <div className="relative h-36 sm:h-48 md:h-56 w-full overflow-hidden bg-[#073729]">
            <img
              src={seller.banner_url || "/images/seller_banner.jpg"}
              alt={seller.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default unsplash/hero banner if local not found
                e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          {/* Store Info Details Container */}
          <div className="p-4 sm:p-5">
            {/* Top Row: Back, Avatar, Name & Address, Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button */}
                <button
                  onClick={() => router.back()}
                  aria-label="Back"
                  className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-[#DDF2D1] text-[#073729] font-black text-base sm:text-lg flex items-center justify-center">
                  {seller.name.slice(0, 1)}
                </div>

                {/* Name & Address */}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate leading-tight">
                    {seller.name}
                  </h1>
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                    <MapPin size={11} className="shrink-0 text-gray-400" />
                    {seller.location}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95",
                    isFollowing
                      ? "bg-[#DDF2D1] text-[#073729]"
                      : "bg-[#005C53] hover:bg-[#044c45] text-white"
                  )}
                >
                  <Heart size={13} className={isFollowing ? "fill-current" : ""} />
                  {isFollowing ? "Following" : "Follow Store"}
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: seller.name, url: window.location.href });
                    }
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#005C53] hover:bg-[#044c45] text-white text-xs font-semibold transition-all active:scale-95"
                >
                  <Share2 size={13} />
                  Share
                </button>

                <Link
                  href="/cart"
                  aria-label="Cart"
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#073729] text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
                >
                  <ShoppingCart size={16} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E84919] text-white text-[9px] font-black flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Rating & Availability Meta Row */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-3 pt-1">
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star size={13} fill="currentColor" />
                {avgRating.toFixed(1)}
              </span>
              <span className="text-gray-300">|</span>
              <span>{reviews.length} Reviews</span>
              <span className="text-gray-300">|</span>
              <span>{seller.delivery_available ? "Delivery available" : "Pickup only"}</span>
            </div>

            {/* Full-width Search Bar */}
            <div className="mt-3.5">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3.5 h-11 bg-white focus-within:border-[#005C53] focus-within:ring-2 focus-within:ring-[#005C53]/15 transition-all">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${seller.name} products`}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs directly attached at the bottom with NO gap */}
          <div className="border-t border-gray-100 px-4 sm:px-5 flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-3 text-xs sm:text-sm font-semibold transition-colors relative shrink-0 flex items-center gap-1.5",
                    isActive
                      ? "text-[#005C53] font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="bg-[#005C53] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {reviews.length}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#005C53] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CARD 2: CATALOG / CONTENT CARD (SAME WIDTH, EXACTLY ALIGNED) ── */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          
          {/* Active Tab: Products */}
          {activeTab === "Products" && (
            <div>
              {/* Header: Title & Count on left, Sort on right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {seller.name} catalog
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {filteredProducts.length} of {sellerProducts.length} fresh products
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Mobile Filters button */}
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
                  >
                    <Filter size={13} />
                    Filters
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative flex items-center border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs">
                    <span className="text-gray-500 mr-1.5">Sort:</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="bg-transparent font-bold text-gray-800 outline-none pr-4 cursor-pointer appearance-none"
                    >
                      <option value="featured">Featured</option>
                      <option value="rating">Top rated</option>
                      <option value="price-low">Price: Low - High</option>
                      <option value="price-high">Price: High - Low</option>
                    </select>
                    <ChevronDown size={13} className="text-gray-400 absolute right-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Sidebar + Product Grid */}
              <div className="flex flex-col sm:flex-row">
                
                {/* Left Sidebar Filter Options */}
                <aside
                  className={cn(
                    "w-full sm:w-56 md:w-60 shrink-0 p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-gray-100 bg-[#FCFDFD]",
                    filtersOpen ? "block" : "hidden sm:block"
                  )}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Filter options</h3>

                  {/* Category Options */}
                  <div className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                      CATEGORY
                    </p>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <label
                          key={cat}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                        >
                          <input
                            type="radio"
                            name="category"
                            checked={category === cat}
                            onChange={() => setCategory(cat)}
                            className="accent-[#005C53] w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Options */}
                  <div className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                      PRICE
                    </p>
                    <div className="space-y-2">
                      {PRICE_OPTIONS.map((opt, i) => (
                        <label
                          key={opt.label}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                        >
                          <input
                            type="radio"
                            name="price"
                            checked={priceIndex === i}
                            onChange={() => setPriceIndex(i)}
                            className="accent-[#005C53] w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {activeFilters.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-semibold text-[#005C53] hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </aside>

                {/* Right Product Grid Area */}
                <div className="flex-1 p-4 sm:p-5 min-w-0">
                  {/* Active filters row */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="font-semibold text-gray-400">Active filters:</span>
                    {activeFilters.length === 0 ? (
                      <span className="text-gray-400">None</span>
                    ) : (
                      activeFilters.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 bg-[#DDF2D1] text-[#073729] font-semibold text-[11px] px-2.5 py-0.5 rounded-full"
                        >
                          {f}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {filteredProducts.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-sm font-bold text-gray-700">No products found</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting your filters</p>
                      <button
                        onClick={clearFilters}
                        className="mt-3 text-xs font-bold text-[#005C53] underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Tab: About */}
          {activeTab === "About" && (
            <div className="p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900">About {seller.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                {seller.name} has been serving fresh produce to neighborhood families in {seller.location}. We harvest and source directly every morning to ensure you receive the freshest vegetables and fruits possible.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-[#F8FAF9] p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Hours</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{seller.opening_time} – {seller.closing_time}</p>
                </div>
                <div className="bg-[#F8FAF9] p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Min Order</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{formatKSh(seller.minimum_order)}</p>
                </div>
                <div className="bg-[#F8FAF9] p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Rating</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{avgRating.toFixed(1)} / 5.0</p>
                </div>
                <div className="bg-[#F8FAF9] p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Location</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{seller.estate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab: Reviews */}
          {activeTab === "Reviews" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="text-3xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                <div>
                  <div className="flex text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Based on {reviews.length} verified reviews</p>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">No reviews yet for this shop&apos;s products.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-xl bg-[#F8FAF9] border border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800">{rev.author_name}</span>
                        <span className="text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5 my-1">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Active Tab: FAQ */}
          {activeTab === "FAQ" && (
            <div className="p-6 divide-y divide-gray-100">
              {[
                { q: "How does delivery work?", a: "Local boda riders deliver directly from the stall to your door within 25 - 35 minutes." },
                { q: "Can I pay with M-Pesa?", a: "Yes, you can pay via M-Pesa STK push during checkout or cash on delivery." },
                { q: "What if an item is not fresh?", a: "We guarantee 100% freshness or instant replacement/refund upon delivery inspection." },
              ].map((faq, i) => (
                <div key={i} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{faq.q}</p>
                  <p className="text-xs text-gray-500 mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
