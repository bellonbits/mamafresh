"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Truck,
  Store,
  Banknote,
  ShieldCheck,
  Phone,
  Smartphone,
  ArrowRight,
  Sparkles,
  Zap,
  Sunrise,
  CalendarClock,
  Navigation,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn, formatKSh } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDeliveryLocation } from "@/lib/hooks/useDeliveryLocation";
import type { SellerRow } from "@/lib/supabase/types";
import TicketReceipt from "@/components/TicketReceipt";

type DeliverySlot = "asap" | "afternoon" | "tomorrow";
type PaymentMethod = "mpesa" | "cash";

const DELIVERY_SLOTS: { id: DeliverySlot; label: string; short: string; desc: string; Icon: typeof Zap }[] = [
  { id: "asap", label: "ASAP (Within 25 - 35 mins)", short: "25 - 35 mins", desc: "Direct from stall", Icon: Zap },
  { id: "afternoon", label: "Today Afternoon (2:00 - 4:00 PM)", short: "2:00 - 4:00 PM today", desc: "Fresh lunch prep", Icon: CalendarClock },
  { id: "tomorrow", label: "Tomorrow Morning (8:00 - 10:00 AM)", short: "8:00 - 10:00 AM tomorrow", desc: "Morning market harvest", Icon: Sunrise },
];

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone || "Not provided";
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, sellerId, getTotalPrice, clearCart } = useCartStore();
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>("asap");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");
  const { locating: locatingAddress, error: addressLocationError, detectCurrentLocation } = useDeliveryLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderPlacedAt, setOrderPlacedAt] = useState<Date | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data: profile }, { data: addresses }] = await Promise.all([
        supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1),
      ]);
      if (!active) return;
      if (profile?.phone) setMpesaPhone(profile.phone);
      if (addresses?.[0]) setAddress(addresses[0].address);
    };
    void load();
    return () => { active = false; };
  }, []);

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === "delivery" ? (seller?.delivery_fee ?? 50) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee);

  const handleUseCurrentAddress = async () => {
    const label = await detectCurrentLocation();
    if (label) setAddress(label);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          items: items.map(({ product, quantity }) => ({
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: product.price,
          })),
          address,
          orderType,
          paymentMethod,
          notes: instructions,
        }),
      });
      const result = await response.json() as { order?: { id: string }; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error ?? "Unable to place order.");
      setOrderId(result.order.id);
      setOrderPlacedAt(new Date());
      setIsSubmitting(false);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to place order.");
      setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  //  Order Placed Success Screen (Matches Design Sheet Exactly)
  // ───────────────────────────────────────────────────────────
  if (orderPlaced) {
    const placedAt = orderPlacedAt ?? new Date();
    const dateTimeLabel = placedAt.toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const ticketCode = orderId ? `MF-${orderId.replace(/-/g, "").slice(0, 10).toUpperCase()}` : "MF-PENDING";

    return (
      <div className="min-h-screen w-full bg-[#FFFDF7] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-full max-w-md flex flex-col items-center">
          <p className="text-xs text-gray-500 mb-5 max-w-xs leading-relaxed">
            Your order has been sent to <span className="font-bold text-gray-900">{seller?.name ?? "your seller"}</span>. Fresh produce is now being packed for you.
          </p>

          <TicketReceipt
            icon="🎉"
            title="Thank You!"
            subtitle="Your order has been placed successfully."
            topFields={[
              { label: "Order ID", value: `#${ticketCode.slice(3, 11)}` },
              { label: "Amount", value: formatKSh(grandTotal) },
            ]}
            secondField={{ label: "Date & Time", value: dateTimeLabel }}
            paymentTitle={paymentMethod === "mpesa" ? "M-Pesa Prompt Sent" : "Cash on Delivery"}
            paymentSubtitle={paymentMethod === "mpesa" ? maskPhone(mpesaPhone) : "Pay the boda rider on arrival"}
            paymentIcon={paymentMethod === "mpesa" ? <Smartphone size={16} strokeWidth={2.2} /> : <Banknote size={16} strokeWidth={2.2} />}
            code={ticketCode}
          />

          {/* Navigation CTAs */}
          <div className="w-full space-y-2.5 mt-8">
            <Link
              href={`/orders/${orderId}`}
              id="track-order-btn"
              className="w-full py-4 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Track Order Live</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/home"
              className="w-full py-3.5 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-bold block hover:bg-gray-50 active:scale-98 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen w-full bg-[#FFFDF7] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <h2 className="text-xl font-black text-[#073729]">Your cart is empty</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">Add products to your cart before checking out.</p>
        <Link href="/home" className="mt-6 px-8 py-3 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-md transition-all active:scale-95">
          Start Shopping
        </Link>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  //  Main Checkout Form
  // ───────────────────────────────────────────────────────────
  const priceSummary = (
    <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
      <div className="flex justify-between text-gray-500">
        <span>Produce Subtotal</span>
        <span className="font-bold text-gray-900">{formatKSh(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>Delivery Fee</span>
        <span className="font-bold text-gray-900">{formatKSh(deliveryFee)}</span>
      </div>
      <div className="flex justify-between text-sm font-black text-[#073729] pt-2 border-t border-gray-100">
        <span>Total Payable</span>
        <span>{formatKSh(grandTotal)}</span>
      </div>
    </section>
  );

  const placeOrderButton = (
    <button
      type="submit"
      disabled={isSubmitting || (orderType === "delivery" && !address.trim())}
      id="place-order-submit-btn"
      className="w-full py-4 rounded-full bg-[#073729] hover:bg-[#0B3D2E] text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
    >
      {isSubmitting ? (
        <span>Sending Order...</span>
      ) : (
        <>
          <ShieldCheck size={16} />
          <span>Place Order | {formatKSh(grandTotal)}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] pb-36 lg:pb-16 animate-fade-in">
      {/* Top Bar */}
      <header className="px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-xs border-b border-gray-100 lg:px-8">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-black text-[#073729]">Checkout</h1>
        <div className="w-9 lg:hidden" />
      </header>

      <form onSubmit={handlePlaceOrder} className="mx-auto max-w-6xl p-4 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:px-8 lg:py-6">
        <div className="space-y-4">
        {submitError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{submitError}</p>}
        {/* 1. Delivery Address Card */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#073729]">
              <MapPin size={15} className="text-[#16A34A]" />
              <span>Delivery Address</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleUseCurrentAddress()}
                disabled={locatingAddress}
                className="flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline disabled:opacity-60"
              >
                <Navigation size={12} className={locatingAddress ? "animate-spin" : ""} />
                {locatingAddress ? "Locating..." : "Use current"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = prompt("Enter your delivery address:", address);
                  if (next) setAddress(next);
                }}
                className="text-xs font-bold text-[#16A34A] hover:underline"
              >
                Change
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-700 font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-snug">
            {address || "Add a delivery address to continue"}
          </p>
          {addressLocationError && <p className="mt-1.5 text-[11px] font-semibold text-red-600">{addressLocationError}</p>}
        </section>

        {/* 2. Delivery Time Slot */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#073729]">
            <Clock size={15} className="text-[#16A34A]" />
            <span>Delivery Schedule</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DELIVERY_SLOTS.map(({ id, label, desc, Icon }) => {
              const isSelected = deliverySlot === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeliverySlot(id as DeliverySlot)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                    isSelected
                      ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100/70"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isSelected ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-500")}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "border-[#16A34A] bg-[#16A34A] text-white"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Delivery vs Pickup Toggle */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#073729]">Fulfillment Method</span>
            <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
              {orderType === "delivery" ? "Boda Rider Delivery" : "Self Pickup"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType("delivery")}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                orderType === "delivery"
                  ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              )}
            >
              <Truck size={16} className="mx-auto mb-1 text-[#16A34A]" />
              <p className="text-xs font-bold">Delivery</p>
              <p className="text-[10px] text-gray-400 mt-0.5">KSh 50</p>
            </button>

            <button
              type="button"
              onClick={() => setOrderType("pickup")}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                orderType === "pickup"
                  ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              )}
            >
              <Store size={16} className="mx-auto mb-1 text-[#16A34A]" />
              <p className="text-xs font-bold">Pickup</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Free</p>
            </button>
          </div>
        </section>

        {/* 4. Payment Method */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#073729]">Payment Method</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> Secure M-Pesa
            </span>
          </div>

          <div className="space-y-2">
            {/* Safaricom M-Pesa */}
            <button
              type="button"
              onClick={() => setPaymentMethod("mpesa")}
              className={cn(
                "w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all",
                paymentMethod === "mpesa"
                  ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100/70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00A859] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  M
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900">M-Pesa STK Push</p>
                  <p className="text-[10px] text-gray-400">Instant prompt on your phone</p>
                </div>
              </div>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                  paymentMethod === "mpesa"
                    ? "border-[#16A34A] bg-[#16A34A] text-white"
                    : "border-gray-300 bg-white"
                )}
              >
                {paymentMethod === "mpesa" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            {/* M-Pesa Phone Input */}
            {paymentMethod === "mpesa" && (
              <div className="pt-1 px-1">
                <label className="text-[10px] font-bold text-gray-400 block mb-1">
                  M-Pesa Registered Number:
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="0712 345 678"
                  />
                </div>
              </div>
            )}

            {/* Cash on Delivery */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={cn(
                "w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all",
                paymentMethod === "cash"
                  ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100/70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  <Banknote size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900">Cash on Delivery</p>
                  <p className="text-[10px] text-gray-400">Pay boda rider upon receiving</p>
                </div>
              </div>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                  paymentMethod === "cash"
                    ? "border-[#16A34A] bg-[#16A34A] text-white"
                    : "border-gray-300 bg-white"
                )}
              >
                {paymentMethod === "cash" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </section>

        {/* 5. Special Instructions / Note */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <label className="text-xs font-extrabold text-[#073729] block">
            Note for Mama Mboga & Rider (Optional)
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Choose ripe avocados for tonight, cut sukuma fine..."
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </section>

        {/* 6. Price Summary — shown here on mobile only; moved into the sidebar on desktop */}
        <div className="lg:hidden">{priceSummary}</div>
        </div>

        {/* Order Summary — sticky sidebar on desktop, fixed bottom bar on mobile */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {priceSummary}
            {placeOrderButton}
          </div>
        </aside>

        {/* Sticky Bottom Place Order CTA — mobile only */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] z-40 lg:hidden">
          {placeOrderButton}
        </div>
      </form>
    </div>
  );
}
