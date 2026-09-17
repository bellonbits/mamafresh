"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Trash2,
  Minus,
  Plus,
  Truck,
  Store,
  MapPin,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatKSh } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SellerRow } from "@/lib/supabase/types";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQty, removeItem, getTotalPrice, sellerId } = useCartStore();
  const [seller, setSeller] = useState<SellerRow | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!sellerId) {
        if (active) setSeller(null);
        return;
      }
      const { data } = await getSupabaseBrowserClient().from("sellers").select("*").eq("id", sellerId).maybeSingle();
      if (active) setSeller(data as SellerRow | null);
    };
    void load();
    return () => { active = false; };
  }, [sellerId]);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === "delivery" ? (seller?.delivery_fee ?? 50) : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen w-full bg-[#FFFDF7] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-4">
          <ShoppingBag size={36} />
        </div>
        <h2 className="text-xl font-black text-[#073729]">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
          Looks like you haven&apos;t added any fresh fruits, vegetables, or groceries yet.
        </p>
        <Link
          href="/"
          className="mt-6 px-8 py-3 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-md transition-all active:scale-95"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const orderTypeCard = (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-3">
      <h3 className="text-xs font-extrabold text-[#073729] uppercase tracking-wider">
        Order Type
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOrderType("delivery")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            orderType === "delivery"
              ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
              : "border-gray-200 bg-gray-50 text-gray-700"
          )}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Truck size={14} className={orderType === "delivery" ? "text-[#16A34A]" : "text-gray-400"} />
            <span>Delivery</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">30-45 mins | To your address</p>
        </button>

        <button
          type="button"
          onClick={() => setOrderType("pickup")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            orderType === "pickup"
              ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
              : "border-gray-200 bg-gray-50 text-gray-700"
          )}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Store size={14} className={orderType === "pickup" ? "text-[#16A34A]" : "text-gray-400"} />
            <span>Pickup</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">15-30 mins | Collect from stall</p>
        </button>
      </div>
    </div>
  );

  const addressCard = seller && (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#16A34A] flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin size={15} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{seller.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{seller.estate}, {seller.location}</p>
        </div>
      </div>
      <Link href="/location" className="text-xs font-bold text-[#C2410C] hover:underline">
        Change
      </Link>
    </div>
  );

  const summaryLines = (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between text-gray-500">
        <span>Subtotal</span>
        <span className="font-bold text-gray-900">{formatKSh(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>Delivery Fee</span>
        <span className="font-bold text-gray-900">{formatKSh(deliveryFee)}</span>
      </div>
      <div className="flex justify-between text-sm font-black text-[#073729] pt-1 border-t border-gray-100">
        <span>Total</span>
        <span>{formatKSh(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] pb-32 lg:pb-16 animate-fade-in">
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-xs border-b border-gray-100 lg:px-8">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-black text-[#073729]">My Cart</h1>
        <div className="w-9 lg:hidden" />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:px-8 lg:py-6">
        {/* Items + options */}
        <main className="space-y-3">
          {items.map((cartItem) => {
            const { product, quantity } = cartItem;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3"
              >
                {/* Product Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="60px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 truncate leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{product.weight || product.unit}</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-sm font-black text-[#073729]">
                      {formatKSh(product.price * quantity)}
                    </span>
                    {product.original_price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatKSh(product.original_price * quantity)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper + Delete Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-[#B6E2BA] rounded-full py-1 px-1.5 flex items-center gap-2">
                    <button
                      onClick={() => updateQty(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-5 h-5 rounded-full bg-white text-[#16A34A] flex items-center justify-center font-bold text-xs shadow-xs active:scale-90"
                    >
                      <Minus size={11} strokeWidth={3} />
                    </button>
                    <span className="font-bold text-xs text-[#073729] min-w-3 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQty(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-90"
                    >
                      <Plus size={11} strokeWidth={3} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label="Remove item"
                    className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center active:scale-90 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Order Type + Address: shown here on mobile only, moved into the sidebar on desktop */}
          <div className="space-y-3 lg:hidden">
            {orderTypeCard}
            {addressCard}
          </div>
        </main>

        {/* Order Summary — sticky sidebar on desktop, fixed bottom bar on mobile */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            {orderTypeCard}
            {addressCard}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
              {summaryLines}
              <Link
                href="/checkout"
                className="w-full py-3.5 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Order Summary & Proceed CTA — mobile only */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] z-40 space-y-2.5 lg:hidden">
        {summaryLines}
        <Link
          href="/checkout"
          className="w-full py-3.5 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
