"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Home as HomeIcon,
  Info,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Percent,
  Phone,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { CATEGORIES } from "@/lib/mock-data";
import { useServiceAreas } from "@/lib/hooks/useServiceAreas";
import { useDeliveryBanner } from "@/lib/hooks/useDeliveryBanner";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import CategoryIcon from "@/components/CategoryIcon";
import ProductCard from "@/components/ProductCard";
import RotatingWord from "@/components/RotatingWord";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { useChatThreads } from "@/lib/hooks/useChatThreads";
import { useDeliveryLocation } from "@/lib/hooks/useDeliveryLocation";
import type { ProductRow } from "@/lib/supabase/types";

interface CurrentUser {
  name: string;
  email: string;
  avatarUrl: string;
}

const HERO_PHRASES = [
  "fresh & healthy foods.",
  "your mama mboga.",
  "farm-fresh groceries.",
  "local produce you can trust.",
  "East Africa's freshest picks.",
];

const promoCards = [
  { title: "Free Delivery", copy: "On orders over KSh 1,500.", action: "Shop now", tone: "bg-[#0B3D2E] text-white", image: "/images/marketing/delivery.jpg" },
  { title: "Ready to cook?", copy: "Fresh ingredients delivered fast.", action: "Explore bundles", tone: "bg-[#E84919] text-white", image: "/images/products/tomatoes.jpg" },
  { title: "40% OFF", copy: "On selected fresh produce.", action: "Grab the offer", tone: "bg-[#F6D43A] text-[#073729]", image: "/images/products/avocado.jpg" },
];

const MENU_ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/shops", label: "Shop", icon: Store },
  { href: "/offers", label: "Offers", icon: Percent },
  { href: "/messages", label: "Messages", icon: MessageCircle, withUnread: true },
  { href: "/assistant", label: "MamaFresh AI", icon: Sparkles, accent: true },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Phone },
];

export default function CustomerHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { location, setLocation, locating, error: locationError, detectCurrentLocation } = useDeliveryLocation();
  const { labels: areaLabels } = useServiceAreas();
  const deliveryBanner = useDeliveryBanner();
  const { isAdmin } = useIsAdmin();
  const { seller } = useCurrentSeller();
  const dashboardHref = isAdmin ? "/admin" : seller ? "/seller" : null;
  const dashboardLabel = isAdmin ? "Admin dashboard" : "Seller dashboard";
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { getTotalItems } = useCartStore();
  const { threads: messageThreads } = useChatThreads({ role: "customer", filterId: userId });
  const unreadMessages = messageThreads.reduce((sum, t) => sum + t.unread, 0);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("is_featured", { ascending: false })
      .then(({ data }) => {
        if (active) {
          setProducts((data ?? []) as ProductRow[]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setCurrentUser(null); setUserId(null); setAuthChecked(true); }
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
      if (active) {
        setCurrentUser({ name: profile?.full_name || user.email?.split("@")[0] || "there", email: user.email ?? "", avatarUrl: profile?.avatar_url ?? "" });
        setUserId(user.id);
        setAuthChecked(true);
      }
    };
    void loadUser();
    return () => { active = false; };
  }, []);

  const chooseLocation = (item: string) => {
    setLocation(item);
    setShowLocationModal(false);
  };

  const handleUseGpsInModal = async () => {
    const result = await detectCurrentLocation();
    if (result) setShowLocationModal(false);
  };

  const featuredProducts = selectedCategory === "all"
    ? products
    : products.filter((product) => product.category_slug === selectedCategory || product.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="home-page bg-[#F4F7F4] pb-28 md:pb-0 animate-fade-in">
      {deliveryBanner.enabled && (
        <div className="bg-[#073729] px-5 py-2 text-center text-[10px] font-semibold tracking-wide text-emerald-100">
          {deliveryBanner.text}
        </div>
      )}

      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
          <Link href="/home" className="flex h-12 w-[132px] items-center text-[#073729] sm:w-[150px]">
            <Image
              src="/logo.png"
              alt="MamaFresh"
              width={300}
              height={200}
              priority
              className="h-full w-full object-contain object-left"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 lg:flex">
            <Link href="/home" className="text-[#16A34A]">Home</Link>
            <Link href="/shops" className="hover:text-[#16A34A]">Shop</Link>
            <Link href="/offers" className="hover:text-[#16A34A]">Offers</Link>
            <Link href="/assistant" className="flex items-center gap-1 hover:text-[#16A34A]"><Sparkles size={14} /> MamaFresh AI</Link>
            <Link href="/about" className="hover:text-[#16A34A]">About</Link>
            <Link href="/contact" className="hover:text-[#16A34A]">Contact</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/search" aria-label="Search" className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-[#84CC16] sm:flex"><Search size={18} /></Link>
            <Link href="/favorites" aria-label="Favorites" className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-[#84CC16] sm:flex"><Heart size={18} /></Link>
            <Link href="/messages" aria-label="Messages" className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-[#84CC16] sm:flex">
              <MessageCircle size={18} />
              {unreadMessages > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{unreadMessages}</span>}
            </Link>
            <Link href="/cart" aria-label="Shopping cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#073729] hover:border-[#84CC16]"><ShoppingCart size={18} />{getTotalItems() > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{getTotalItems()}</span>}</Link>
            {dashboardHref && (
              <Link href={dashboardHref} aria-label={dashboardLabel} title={dashboardLabel} className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#84CC16] bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] sm:flex">
                <LayoutDashboard size={18} />
              </Link>
            )}
            {!authChecked ? (
              <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#073729] text-white sm:flex"><UserRound size={17} /></span>
            ) : currentUser ? (
              <Link href="/account" aria-label="Account" className="hidden items-center gap-2 rounded-full bg-[#073729] py-1.5 pl-1.5 pr-3.5 text-white sm:flex">
                <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#84CC16] text-[10px] font-black text-[#073729]">
                  {currentUser.avatarUrl ? <Image src={currentUser.avatarUrl} alt={currentUser.name} fill className="object-cover" sizes="28px" /> : currentUser.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate text-xs font-bold">{currentUser.name}</span>
              </Link>
            ) : (
              <Link href="/login" aria-label="Sign in" className="hidden items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-xs font-bold text-[#073729] hover:border-[#84CC16] sm:flex">
                <UserRound size={15} /> Sign in
              </Link>
            )}
            <button onClick={() => setShowMenu(!showMenu)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#073729] lg:hidden">{showMenu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {showMenu && <nav className="border-t border-gray-100 px-5 py-3 lg:hidden">
          {authChecked && (
            <Link href={currentUser ? "/account" : "/login"} className="mb-3 flex items-center gap-2.5 rounded-xl bg-[#F4F7F4] p-2.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#073729] text-xs font-black text-white">
                {currentUser?.avatarUrl ? <Image src={currentUser.avatarUrl} alt={currentUser.name} fill className="object-cover" sizes="32px" /> : currentUser ? currentUser.name.slice(0, 1).toUpperCase() : <UserRound size={15} />}
              </span>
              <span className="text-xs">
                <span className="block font-bold text-gray-900">{currentUser ? currentUser.name : "Sign in"}</span>
                <span className="text-[10px] text-gray-400">{currentUser ? currentUser.email : "Tap to sign in to your account"}</span>
              </span>
            </Link>
          )}
          <div className="flex flex-col divide-y divide-gray-100">
            {dashboardHref && (
              <Link href={dashboardHref} onClick={() => setShowMenu(false)} className="flex items-center justify-between py-3 text-sm font-semibold text-[#16A34A]">
                <span className="flex items-center gap-3"><LayoutDashboard size={17} className="text-[#16A34A]" />{dashboardLabel}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            )}
            {MENU_ITEMS.map(({ href, label, icon: Icon, withUnread, accent }) => (
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
                  {withUnread && unreadMessages > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{unreadMessages}</span>
                  )}
                </span>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>
        </nav>}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Avatar + greeting + notifications — mobile only */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <Link href={currentUser ? "/account" : "/login"} aria-label="Account" className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#073729] text-sm font-black text-white">
            {currentUser?.avatarUrl ? <Image src={currentUser.avatarUrl} alt={currentUser.name} fill className="object-cover" sizes="44px" /> : currentUser ? currentUser.name.slice(0, 1).toUpperCase() : <UserRound size={18} />}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">Welcome,</p>
            <p className="truncate text-sm font-black text-gray-900">{currentUser ? currentUser.name : "there"}</p>
          </div>
          <Link href="/messages" aria-label="Notifications" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[#073729] shadow-sm">
            <Bell size={17} />
            {unreadMessages > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{unreadMessages}</span>}
          </Link>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 text-left text-sm font-bold text-[#073729]">
            <MapPin size={17} className="text-[#84CC16] lg:hidden" />
            <span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400 lg:hidden">Deliver to</span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wider text-gray-400 lg:block">Deliver to</span>
              {location}
            </span>
            <ChevronDown size={15} className="text-gray-400" />
          </button>
          <Link href="/search" className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-400 shadow-sm lg:flex lg:w-80"><Search size={15} /><span>Search fresh vegetables, fruits...</span></Link>
          <Link href="/shops" aria-label="Filter products" className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#84CC16] text-[#073729] shadow-sm lg:flex"><SlidersHorizontal size={17} /></Link>
        </div>

        {/* Search bar — mobile only */}
        <Link href="/search" className="mb-5 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-sm lg:hidden"><Search size={16} /><span>Search...</span></Link>

        <section className="relative hidden overflow-hidden rounded-[28px] bg-[#073729] px-6 py-10 text-white sm:px-10 lg:block lg:min-h-[360px] lg:px-14 lg:py-14">
          <div className="relative z-10 max-w-xl">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#84CC16] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#073729]"><Sparkles size={12} /> Fresh every morning</p>
            <h1 className="max-w-lg text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">Your trusted source for <RotatingWord words={HERO_PHRASES} className="text-[#B8EF4A]" /></h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/70">Shop neighborhood produce from mama mbogas and get quality groceries delivered quickly across East Africa.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/shops" className="rounded-full bg-[#B8EF4A] px-5 py-3 text-xs font-black text-[#073729] hover:bg-white">Shop now</Link><Link href="/offers" className="rounded-full border border-[#B8EF4A]/60 px-5 py-3 text-xs font-black text-[#B8EF4A] hover:bg-white/10">Explore offers</Link></div>
          </div>
          <div className="pointer-events-none absolute inset-0"><Image src="/homee_card.png" alt="Fresh vegetables" fill priority className="object-cover object-center" sizes="(max-width: 768px) 100vw, 1200px" /><div className="absolute inset-0 bg-gradient-to-r from-[#073729] via-[#073729]/85 via-40% to-transparent" /></div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#073729]">Shop by category</h2>
            <Link href="/categories" className="text-xs font-bold text-[#16A34A] hover:underline">
              View all <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="scroll-x flex gap-5 pb-4 pt-2 pl-3 pr-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className="flex flex-col items-center shrink-0 group transition-transform active:scale-95 text-center"
            >
              <div className={cn("transition-all group-hover:scale-105 rounded-2xl", selectedCategory === "all" ? "scale-105 ring-2 ring-[#16A34A] shadow-md" : "opacity-95")}>
                <CategoryIcon slug="all" size={62} noFrame />
              </div>
              <span className={cn("text-xs font-bold mt-2 w-[72px] truncate transition-colors text-center", selectedCategory === "all" ? "text-[#073729] font-black" : "text-gray-700")}>
                All products
              </span>
            </button>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className="flex flex-col items-center shrink-0 group transition-transform active:scale-95 text-center"
                >
                  <div className={cn("transition-all group-hover:scale-105 rounded-2xl", isSelected ? "scale-105 ring-2 ring-[#16A34A] shadow-md" : "opacity-95")}>
                    <CategoryIcon slug={category.slug} size={62} noFrame />
                  </div>
                  <span className={cn("text-xs font-bold mt-2 w-[72px] truncate transition-colors text-center", isSelected ? "text-[#073729] font-black" : "text-gray-700")}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 lg:mt-9"><div className="mb-4 flex items-end justify-between lg:mb-4"><div><h2 className="text-xl font-black text-[#073729] lg:hidden">Special Offers</h2><h2 className="hidden text-xl font-black text-[#073729] lg:block">Deals of the week</h2><p className="mt-1 text-xs text-gray-400 hidden lg:block">Fresh picks at stall-direct prices</p></div><Link href="/offers" className="text-xs font-bold text-[#16A34A] lg:inline hidden">View all <ArrowRight size={13} className="inline" /></Link></div><div className="scroll-x flex gap-3 pb-1 lg:hidden">{promoCards.map((promo) => <Link href="/offers" key={promo.title} className={cn("relative min-w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl p-5 shadow-sm", promo.tone)}><div className="relative z-10 max-w-[58%]"><h3 className="text-lg font-black leading-tight">{promo.title}</h3><p className="mt-1 text-xs opacity-80">{promo.copy}</p><span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-[#073729]">{promo.action}<ArrowRight size={12} /></span></div><Image src={promo.image} alt="" fill className="object-contain object-right opacity-80 mix-blend-multiply" sizes="85vw" /></Link>)}</div><div className="hidden gap-4 lg:grid lg:grid-cols-3">{promoCards.map((promo) => <Link href="/offers" key={promo.title} className={cn("relative min-h-40 overflow-hidden rounded-2xl p-5 shadow-sm transition hover:-translate-y-1", promo.tone)}><div className="relative z-10 max-w-[58%]"><h3 className="text-lg font-black leading-tight">{promo.title}</h3><p className="mt-1 text-xs opacity-80">{promo.copy}</p><span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-[#073729]">{promo.action}<ArrowRight size={12} /></span></div><Image src={promo.image} alt="" fill className="object-contain object-right opacity-80 mix-blend-multiply" sizes="240px" /></Link>)}</div></section>

        <section className="mt-8 lg:mt-10"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black text-[#073729]">Popular Items</h2><p className="mt-1 text-xs text-gray-400 lg:block hidden">Popular with shoppers near you</p></div><Link href="/shops" className="text-xs font-bold text-[#16A34A]">View All <ArrowRight size={13} className="inline" /></Link></div>{loading ? (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>) : featuredProducts.length === 0 ? (<p className="py-10 text-center text-sm text-gray-400">No products available yet.</p>) : (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{featuredProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>)}</section>

        <section className="mt-10 rounded-3xl bg-[#E6F4D2] px-6 py-8 sm:px-10 lg:flex lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-[#16A34A]">MamaFresh promise</p><h2 className="mt-2 max-w-xl text-2xl font-black text-[#073729]">Fresh produce, fair prices, and neighborhood sellers you can trust.</h2></div><Link href="/about" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#073729] px-5 py-3 text-xs font-black text-white lg:mt-0">Our mission <ArrowRight size={14} /></Link></section>
      </main>

      {showLocationModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setShowLocationModal(false)}><div className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-white p-6 sm:max-h-[80dvh] sm:rounded-3xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex shrink-0 items-center justify-between"><div><h3 className="font-black text-gray-900">Delivery location</h3><p className="text-xs text-gray-400">Choose your neighborhood</p></div><button onClick={() => setShowLocationModal(false)} aria-label="Close location dialog" className="rounded-full bg-gray-100 p-2"><X size={16} /></button></div>
        <button onClick={() => void handleUseGpsInModal()} disabled={locating} className="mb-3 flex w-full shrink-0 items-center gap-3 rounded-xl border border-[#B6E2BA] bg-[#EAF7EE] p-3 text-left transition-colors hover:bg-[#DCF2E2] disabled:opacity-70">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white"><Navigation size={16} className={locating ? "animate-spin" : ""} /></span>
          <span><span className="block text-sm font-bold text-[#073729]">{locating ? "Locating..." : "Use my current location"}</span><span className="block text-[11px] text-[#15803d]">Real GPS via your browser</span></span>
        </button>
        {locationError && <p className="mb-3 flex shrink-0 items-start gap-1.5 rounded-lg bg-red-50 p-2.5 text-[11px] font-semibold text-red-700"><AlertCircle size={12} className="mt-0.5 shrink-0" />{locationError}</p>}
        <div className="min-h-0 flex-1 overflow-y-auto"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Or choose a neighborhood</p>
        <div className="space-y-2 pb-1">{areaLabels.map((item) => <button key={item} onClick={() => chooseLocation(item)} className={cn("flex w-full items-center justify-between rounded-xl p-3 text-left text-sm font-semibold", location === item ? "bg-[#E6F4D2] text-[#073729]" : "bg-gray-50 text-gray-700")}>{item}{location === item && <Check size={16} className="text-[#16A34A]" />}</button>)}</div></div></div></div>}
    </div>
  );
}
