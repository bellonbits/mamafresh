"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Heart, Mail, Search, ShoppingBag, Star, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/mock-data";
import { cn, formatKSh } from "@/lib/utils";
import CategoryIcon from "@/components/CategoryIcon";
import SellerAssistantCard from "@/components/SellerAssistantCard";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, OrderRow, OrderItemRow } from "@/lib/supabase/types";

type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };

export default function SellerDashboardPage() {
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    if (!seller) return;
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [{ data: productsData }, { data: ordersData }] = await Promise.all([
        supabase.from("products").select("*").eq("seller_id", seller.id),
        supabase.from("orders").select("*, order_items(*)").eq("seller_id", seller.id).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setProducts((productsData ?? []) as ProductRow[]);
      const orders = (ordersData ?? []) as OrderWithItems[];
      setRecentOrders(orders.slice(0, 4));
      const todaysOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
      setTodaySales(todaysOrders.reduce((sum, o) => sum + o.total, 0));
      setTodayOrders(todaysOrders.length);
      setPendingOrders(orders.filter((o) => o.status === "pending" || o.status === "accepted").length);
    };
    void load();
    return () => { active = false; };
  }, [seller]);

  const filteredProducts = useMemo(
    () => products.filter((product) => category === "All" || product.category_slug === category),
    [products, category]
  );

  if (sellerLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading dashboard...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">You don&apos;t have a shop yet</p>
        <p className="text-sm text-gray-500 max-w-sm">Register your stall to start selling on MamaFresh.</p>
        <Link href="/seller/register" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Register your shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8F4] bg-[radial-gradient(#d9eee1_1px,transparent_1px)] bg-[size:18px_18px] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1320px]">
        <header className="mb-7 flex items-center gap-4 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-full border border-gray-100 bg-white px-4 py-2.5">
            <Search size={17} className="shrink-0 text-[#22AE67]" /><input placeholder="Search your grocery products etc...." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
          </div>
          <button aria-label="Calendar" className="hidden text-[#22AE67] sm:block"><CalendarDays size={19} /></button><button aria-label="Messages" className="hidden text-[#22AE67] sm:block"><Mail size={19} /></button><button aria-label="Notifications" className="text-[#22AE67]"><Bell size={19} /></button><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7C5A3] text-xs font-black text-[#8C4D28]">{seller.name.slice(0, 2).toUpperCase()}</div>
        </header>

        <div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-800">Categories</h1><button className="hidden items-center gap-2 rounded-lg border border-[#22AE67] px-3 py-1.5 text-xs font-bold text-[#168B55] sm:flex"><SlidersHorizontal size={13} /> Filter</button></div>
        <div className="scroll-x mb-7 flex gap-5 pb-3 pt-2 pl-2">
          <button
            onClick={() => setCategory("All")}
            className="flex flex-col items-center shrink-0 gap-1.5 text-center group transition-transform active:scale-95"
          >
            <div className={cn("transition-all group-hover:scale-105 rounded-2xl", category === "All" ? "ring-2 ring-[#22AE67] scale-105 shadow-md" : "opacity-90")}>
              <CategoryIcon slug="all" size={56} noFrame />
            </div>
            <span className={cn("text-[11px] font-bold w-[68px] truncate", category === "All" ? "text-[#168B55] font-black" : "text-gray-600")}>All</span>
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.slug}
              onClick={() => setCategory(item.slug)}
              className="flex flex-col items-center shrink-0 gap-1.5 text-center group transition-transform active:scale-95"
            >
              <div className={cn("transition-all group-hover:scale-105 rounded-2xl", category === item.slug ? "ring-2 ring-[#22AE67] scale-105 shadow-md" : "opacity-90")}>
                <CategoryIcon slug={item.slug} size={56} noFrame />
              </div>
              <span className={cn("text-[11px] font-bold w-[68px] truncate", category === item.slug ? "text-[#168B55] font-black" : "text-gray-600")}>{item.name}</span>
            </button>
          ))}
        </div>

        <section className="mb-7">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800">Your Products</h2><Link href="/seller/products" className="text-xs font-semibold text-[#168B55]">View More</Link></div>
          {filteredProducts.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">No products yet. <Link href="/seller/products/new" className="font-bold text-[#168B55]">Add your first product</Link>.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.slice(0, 5).map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group relative rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <Heart size={15} className="absolute right-3 top-3 z-10 text-red-400" fill={product.is_featured ? "currentColor" : "none"} />
                  <div className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-[#F8FBF9]"><Image src={product.image_url} alt={product.name} fill className="object-contain p-3 transition group-hover:scale-105" sizes="180px" /></div>
                  <h3 className="truncate text-sm font-bold text-gray-800">{product.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><Star size={11} fill="#F5B916" className="text-[#F5B916]" /> {product.rating} <span>/ {product.unit}</span></p>
                  <div className="mt-2 flex items-center justify-between"><span className="text-sm font-black text-[#19A66A]">{formatKSh(product.price)}</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22AE67] text-white">+</span></div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Last Orders</h2>
            <div className="rounded-2xl bg-white px-4 shadow-sm">
              {recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No orders yet.</p>
              ) : recentOrders.map((order) => (
                <Link href="/seller/orders" key={order.id} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E4F2E9]"><ShoppingBag size={18} className="text-[#168B55]" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-gray-800">{order.order_items[0]?.product_name ?? "Order"}</p><p className="text-[10px] text-gray-400">{order.order_items.length} items · {order.status}</p></div>
                  <span className="text-xs font-bold text-[#19A66A]">{formatKSh(order.total)}</span>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Ask MamaFresh AI</h2>
            <SellerAssistantCard sellerName={seller.name} />
          </section>
        </div>

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800">Today at a glance</h2></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-2xl bg-[#22AE67] p-4 text-white"><p className="text-sm font-bold">Today&apos;s sales</p><p className="mt-1 text-2xl font-black">{formatKSh(todaySales)}</p></div>
            <div className="h-24 rounded-2xl bg-[#E64D58] p-4 text-white"><p className="text-sm font-bold">Orders today</p><p className="mt-1 text-2xl font-black">{todayOrders}</p></div>
            <div className="h-24 rounded-2xl bg-[#F7931E] p-4 text-white"><p className="text-sm font-bold">Pending orders</p><p className="mt-1 text-2xl font-black">{pendingOrders}</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
