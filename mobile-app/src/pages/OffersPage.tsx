
import { useEffect, useState } from "react";
import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { ArrowRight, Check, ChevronRight, Copy, Home as HomeIcon, Info, Menu, Percent, Sparkles, Store, Tag, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/mock-data";
import CategoryIcon from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDeliveryBanner } from "@/lib/hooks/useDeliveryBanner";
import type { ProductRow, PromotionRow } from "@/lib/supabase/types";

const MENU_ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/shops", label: "Shop", icon: Store },
  { href: "/offers", label: "Offers", icon: Percent },
  { href: "/assistant", label: "MamaFresh AI", icon: Sparkles, accent: true },
  { href: "/about", label: "About", icon: Info },
];

const promos = [
  { title: "30% Flat Discount", copy: "Fresh produce, better prices for your everyday shop.", image: "/offers.png", tone: "bg-[#F2A51A] text-[#073729]" },
  { title: "Fresh deals delivered", copy: "Save more on selected neighborhood groceries.", image: "/offers.png", tone: "bg-[#F2A51A] text-[#073729]" },
  { title: "Free delivery", copy: "On orders over KSh 1,500 across East Africa.", image: "/offers.png", tone: "bg-[#F2A51A] text-[#073729]" },
];

export default function OffersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [showMenu, setShowMenu] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const deliveryBanner = useDeliveryBanner();

  useEffect(() => {
    let active = true;
    const now = new Date().toISOString().slice(0, 10);
    void getSupabaseBrowserClient()
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .then(({ data }) => { if (active) setPromotions((data ?? []) as PromotionRow[]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("products")
      .select("*")
      .eq("is_available", true)
      .gt("discount_tag", "")
      .then(({ data }) => {
        if (active) {
          setProducts((data ?? []) as ProductRow[]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const offerProducts = products.filter((product) => category === "all" || product.category_slug === category).slice(0, 10);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="bg-[#F4F7F4] animate-fade-in">
      {deliveryBanner.enabled && <div className="bg-[#073729] px-5 py-2 text-center text-[10px] font-semibold tracking-wide text-emerald-100" style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}>{deliveryBanner.text}</div>}
      <header className="border-b border-emerald-100 bg-white" style={deliveryBanner.enabled ? undefined : { paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
          <Link href="/home" className="flex h-12 w-[132px] shrink-0 items-center sm:w-[150px]"><Image src="/logo.png" alt="MamaFresh" width={300} height={200} priority className="h-full w-full object-contain object-left" /></Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 lg:flex"><Link href="/home" className="hover:text-[#16A34A]">Home</Link><Link href="/shops" className="hover:text-[#16A34A]">Shop</Link><Link href="/offers" className="text-[#16A34A]">Offers</Link><Link href="/assistant" className="flex items-center gap-1 hover:text-[#16A34A]"><Sparkles size={14} /> MamaFresh AI</Link><Link href="/about" className="hover:text-[#16A34A]">About</Link><Link href="/contact" className="hover:text-[#16A34A]">Contact</Link></nav>
          <div className="ml-auto"><button onClick={() => setShowMenu(!showMenu)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#073729] lg:hidden">{showMenu ? <X size={18} /> : <Menu size={18} />}</button></div>
        </div>
        {showMenu && (
          <nav className="border-t border-gray-100 px-5 py-1 lg:hidden">
            <div className="flex flex-col divide-y divide-gray-100">
              {MENU_ITEMS.map(({ href, label, icon: Icon, accent }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMenu(false)}
                  className={cn(
                    "flex items-center justify-between py-3 text-sm font-semibold",
                    accent ? "text-[#16A34A]" : "text-gray-700"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} className={accent ? "text-[#16A34A]" : "text-gray-400"} />
                    {label}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative min-h-56 overflow-hidden rounded-2xl bg-[#5BAACB] px-6 py-8 sm:min-h-64 sm:px-10 lg:min-h-72 lg:px-14 lg:py-12"><Image src="/offer.png" alt="Fresh grocery offer" fill className="object-cover object-right" sizes="900px" /><div className="absolute inset-0 bg-gradient-to-r from-[#5BAACB]/95 via-[#5BAACB]/65 to-transparent" /><div className="relative z-10 max-w-lg rounded-2xl bg-white/20 p-4 backdrop-blur-md sm:p-6"><span className="inline-flex items-center gap-1 rounded-full bg-[#E84919] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white"><Sparkles size={12} /> Mega grocery sale</span><h1 className="mt-3 text-3xl font-black leading-tight text-[#073729] sm:text-4xl lg:text-5xl">30% flat discount on fresh groceries.</h1><p className="mt-3 max-w-md text-sm text-[#073729]/80">Special prices from trusted neighborhood sellers, available while stocks last.</p><Link href="/shops" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#073729] px-5 py-3 text-xs font-black text-white">Shop deals <ArrowRight size={14} /></Link></div></section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#073729]">Shop by category</h2>
            <Link href="/categories" className="text-xs font-bold text-[#16A34A] hover:underline">
              View all <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="scroll-x flex gap-5 pb-3 pt-2 pl-1">
            {[{ id: "all", slug: "all", name: "All deals" }, ...CATEGORIES].map((item) => {
              const isSelected = category === item.slug;
              return (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.slug)}
                  className="flex flex-col items-center shrink-0 group transition-transform active:scale-95 text-center"
                >
                  <div className={cn(
                    "transition-all group-hover:scale-105 rounded-2xl p-0.5",
                    isSelected
                      ? "ring-2 ring-[#16A34A] scale-105 shadow-md"
                      : "opacity-90 hover:opacity-100"
                  )}>
                    <CategoryIcon slug={item.slug} size={52} noFrame />
                  </div>
                  <span className={cn(
                    "text-xs mt-1.5 w-[68px] truncate transition-colors text-center",
                    isSelected ? "font-black text-[#073729]" : "font-bold text-gray-600"
                  )}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {promotions.length > 0 && (
          <section>
            <div className="mb-4"><h2 className="text-xl font-black text-[#073729]">Active promotions</h2><p className="mt-1 text-xs text-gray-400">Campaigns running right now</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {promotions.map((promo) => (
                <Link key={promo.id} href={promo.category_slug ? `/categories/${promo.category_slug}` : "/shops"} className="relative min-h-32 overflow-hidden rounded-2xl bg-[#073729] p-5 text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#B8EF4A] px-2.5 py-1 text-[10px] font-black text-[#073729]">{promo.discount_percent}% OFF</span>
                  <h3 className="mt-2 text-lg font-black leading-tight">{promo.title}</h3>
                  <p className="mt-1 text-[10px] text-emerald-100/70">Until {new Date(promo.ends_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black text-[#073729]">Trending deals</h2><p className="mt-1 text-xs text-gray-400">Fresh savings picked for today</p></div><span className="flex items-center gap-1 text-xs font-bold text-[#E84919]"><Tag size={14} /> Limited offers</span></div><div className="grid gap-4 md:grid-cols-3">{promos.map((promo) => <Link key={promo.title} href="/shops" className={cn("relative min-h-44 overflow-hidden rounded-2xl p-5", promo.tone)}><div className="absolute inset-0 bg-gradient-to-r from-[#F2A51A]/95 via-[#F2A51A]/60 to-transparent" /><div className="relative z-10 max-w-[60%]"><h3 className="text-xl font-black leading-tight">{promo.title}</h3><p className="mt-2 text-xs opacity-75">{promo.copy}</p><span className="mt-5 inline-flex rounded-full bg-white/90 px-3 py-2 text-[10px] font-black text-[#073729]">Shop now <ArrowRight size={12} className="ml-1" /></span></div><Image src={promo.image} alt="Fresh grocery offer" fill className="object-cover object-right opacity-90" sizes="420px" /></Link>)}</div></section>

        <section className="grid gap-3 md:grid-cols-2"><div className="flex items-center justify-between rounded-2xl bg-[#073729] p-5 text-white"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#B8EF4A]">First order</p><h3 className="mt-1 text-lg font-black">10% off your first shop</h3><p className="mt-1 text-xs text-emerald-100/70">Use this code at checkout.</p></div><button onClick={() => copyCode("FRESH10")} className="flex items-center gap-1 rounded-lg bg-[#B8EF4A] px-3 py-2 text-[10px] font-black text-[#073729]">{copied === "FRESH10" ? <Check size={12} /> : <Copy size={12} />} {copied === "FRESH10" ? "COPIED" : "FRESH10"}</button></div><div className="flex items-center justify-between rounded-2xl bg-[#E6F4D2] p-5 text-[#073729]"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Delivery voucher</p><h3 className="mt-1 text-lg font-black">Free delivery over KSh 500</h3><p className="mt-1 text-xs text-[#073729]/60">For local neighborhood orders.</p></div><button onClick={() => copyCode("LOCALFREE")} className="flex items-center gap-1 rounded-lg bg-[#073729] px-3 py-2 text-[10px] font-black text-white">{copied === "LOCALFREE" ? <Check size={12} /> : <Copy size={12} />} {copied === "LOCALFREE" ? "COPIED" : "LOCALFREE"}</button></div></section>

        <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black text-[#073729]">Popular products {category !== "all" && <span className="text-[#16A34A]">· {CATEGORIES.find(c => c.slug === category)?.name}</span>}</h2><p className="mt-1 text-xs text-gray-400">Discounted essentials shoppers love</p></div><Link href="/shops" className="text-xs font-bold text-[#16A34A]">View all <ArrowRight size={13} className="inline" /></Link></div>{loading ? (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>) : offerProducts.length === 0 ? (<p className="py-10 text-center text-sm text-gray-400">No active offers right now — check back soon.</p>) : (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{offerProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>)}</section>

        <section className="relative overflow-hidden rounded-2xl bg-[#073729] px-6 py-8 text-white sm:px-10 lg:flex lg:items-center lg:justify-between"><div className="relative z-10"><p className="text-xs font-black uppercase tracking-wider text-[#B8EF4A]">Fast neighborhood delivery</p><h2 className="mt-2 max-w-xl text-2xl font-black sm:text-3xl">Fresh savings delivered to your doorstep.</h2><p className="mt-2 text-sm text-emerald-100/70">Shop local, save more, and enjoy fresh produce from neighborhood sellers.</p></div><Link href="/shops" className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-[#B8EF4A] px-5 py-3 text-xs font-black text-[#073729] lg:mt-0">Start shopping <ArrowRight size={14} /></Link><Image src="/images/marketing/delivery.jpg" alt="Fresh delivery" fill className="object-cover object-right opacity-40" sizes="500px" /></section>
      </main>
    </div>
  );
}
