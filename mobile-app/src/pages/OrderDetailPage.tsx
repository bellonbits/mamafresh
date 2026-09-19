
import { useEffect, useState } from "react";
import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { useParams } from "@/lib/next-compat/navigation";
import { CheckCircle2, ChevronRight, PackageCheck, AlertTriangle, X, Navigation, Clock3 } from "lucide-react";
import { getDefaultProductImage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { estimateEta, type LatLng } from "@/lib/eta";
import { forwardGeocode } from "@/lib/geocode";
import DeliveryMap from "@/components/DeliveryMap";
import type { OrderRow, OrderItemRow } from "@/lib/supabase/types";

const STATUS_STEPS: { key: OrderRow["status"]; label: string }[] = [
  { key: "pending", label: "Order confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const formatPrice = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;

type OrderWithRelations = OrderRow & { order_items: OrderItemRow[]; sellers: { name: string } | null; profiles: { full_name: string } | null };

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [destCoords, setDestCoords] = useState<LatLng | null>(null);
  const [destError, setDestError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (active) setUserId(user?.id ?? null);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("orders")
      .select("*, order_items(*), sellers(name), profiles(full_name)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data) {
          setNotFoundFlag(true);
        } else {
          setOrder(data as unknown as OrderWithRelations);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  // Live seller position — the seller's device writes seller_lat/lng while delivering.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        const row = payload.new as OrderRow;
        setOrder((current) => (current ? { ...current, ...row } : current));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id]);

  // Resolve the delivery address to real coordinates once, so the map has a destination pin.
  useEffect(() => {
    if (!order || order.order_type !== "delivery" || !order.delivery_address.trim()) return;
    let active = true;
    forwardGeocode(order.delivery_address)
      .then((coords) => { if (active) setDestCoords(coords); })
      .catch(() => { if (active) setDestError("Couldn't locate the delivery address on the map."); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.delivery_address]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f5f4] text-sm font-bold text-gray-400">Loading order...</div>;
  }

  if (notFoundFlag || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f5f4] p-6 text-center">
        <p className="text-lg font-black text-gray-800">Order not found</p>
        <Link href="/orders" className="rounded-full bg-[#073729] px-5 py-2.5 text-xs font-bold text-white">Back to my orders</Link>
      </div>
    );
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !reportSubject.trim()) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      const { error } = await getSupabaseBrowserClient().from("complaints").insert({
        order_id: order.id,
        customer_id: userId,
        seller_id: order.seller_id,
        subject: reportSubject.trim(),
        description: reportDescription.trim(),
      });
      if (error) throw error;
      setReportSent(true);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Unable to send your report. Try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const isCancelled = order.status === "cancelled";
  const currentStepIdx = isCancelled
    ? 0
    : order.status === "delivered"
      ? STATUS_STEPS.length - 1
      : order.status === "out_for_delivery"
        ? 2
        : order.status === "preparing" || order.status === "accepted"
          ? 1
          : 0;

  return (
    <div className="bg-[#f5f5f4] animate-fade-in">
      <main className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-[10px] text-[#777]" aria-label="Breadcrumb">
          <Link href="/home" className="hover:text-[#073729]">Home</Link><ChevronRight size={11} />
          <Link href="/account" className="hover:text-[#073729]">My Account</Link><ChevronRight size={11} />
          <Link href="/orders" className="hover:text-[#073729]">My Orders</Link><ChevronRight size={11} />
          <span className="text-[#555]">Order ID: {order.id.slice(0, 8).toUpperCase()}</span>
        </nav>
        <div className="mb-6 grid grid-cols-1 divide-y rounded-xl bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4"><p className="text-[11px] font-bold text-[#333]">Order ID: {order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 text-[10px] text-[#555]">{order.order_items.length} items</p></div>
          <div className="p-4"><p className="text-sm font-bold text-[#333]">{formatPrice(order.total)}</p><p className="mt-1 text-[10px] font-semibold text-[#75a62b]">{order.sellers?.name ?? "MamaFresh seller"}</p></div>
          <div className="p-4 text-[10px] text-[#555]">{new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(250px,0.75fr)]">
          <section>
            <h1 className="mb-6 text-sm font-bold text-[#353535]">Items Ordered &amp; Delivery Status</h1>
            <section className="border-b border-[#e8e5e2] pb-7 last:border-0">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#353535]">Order status</h2>
                <span className={cn("flex items-center gap-1 text-[11px] font-semibold", isCancelled ? "text-red-500" : order.status === "delivered" ? "text-[#75a62b]" : "text-[#e58b22]")}>
                  <span className={cn("h-2 w-2 rounded-full", isCancelled ? "bg-red-500" : order.status === "delivered" ? "bg-[#75a62b]" : "bg-[#e58b22]")} />
                  {isCancelled ? "Cancelled" : order.status === "delivered" ? "Delivered" : "In progress"}
                </span>
              </div>
              {!isCancelled && (
                <div className="mb-7 flex items-start">
                  {STATUS_STEPS.map((step, index) => {
                    const complete = index <= currentStepIdx;
                    return (
                      <div key={step.key} className="relative flex flex-1 flex-col items-center text-center">
                        {index < STATUS_STEPS.length - 1 && <span className={cn("absolute left-1/2 top-2.5 h-px w-full", index < currentStepIdx ? "bg-[#7ba83a]" : "border-t border-dotted border-[#bdbdbd]")} />}
                        <span className={cn("relative z-10 flex h-5 w-5 items-center justify-center rounded-full border", complete ? "border-[#7ba83a] bg-[#7ba83a] text-white" : "border-[#c9c9c9] bg-white text-transparent")}>
                          {complete && <CheckCircle2 size={14} />}
                        </span>
                        <p className="mt-2 text-[10px] font-semibold text-[#4d4d4d]">{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#ecebea] px-2.5 py-2">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f2f1ef]">
                      <Image src={getDefaultProductImage(item.product_name)} alt={item.product_name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-[#555]">{item.product_name}</p>
                      <p className="mt-1 text-[10px] text-[#777]">Qty: {item.quantity}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#333]">{formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
          <aside className="space-y-6">
            {!isCancelled && order.status !== "delivered" && order.order_type === "delivery" && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#353535]"><Navigation size={15} />Live delivery tracking</h2>
                {destCoords ? (
                  <div className="overflow-hidden rounded-xl border border-[#e4e1df] bg-white">
                    <DeliveryMap
                      destination={destCoords}
                      sellerPosition={order.seller_lat != null && order.seller_lng != null ? { lat: order.seller_lat, lng: order.seller_lng } : null}
                      sellerName={order.sellers?.name ?? "Your mama mboga"}
                      className="h-56 w-full"
                    />
                    <div className="p-3">
                      {order.seller_lat != null && order.seller_lng != null ? (
                        (() => {
                          const eta = estimateEta({ lat: order.seller_lat, lng: order.seller_lng }, destCoords);
                          return (
                            <p className="flex items-center gap-1.5 text-xs font-bold text-[#073729]">
                              <Clock3 size={13} className="text-[#16A34A]" />
                              Arriving in ~{eta.minutes} min ({eta.distanceKm < 1 ? `${Math.round(eta.distanceKm * 1000)} m` : `${eta.distanceKm.toFixed(1)} km`} away) — around {eta.arrivalTime.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          );
                        })()
                      ) : (
                        <p className="text-[11px] text-gray-500">{order.sellers?.name ?? "Your mama mboga"} hasn&apos;t started sharing their location yet.</p>
                      )}
                    </div>
                  </div>
                ) : destError ? (
                  <p className="rounded-xl border border-[#e4e1df] bg-white p-3 text-[11px] text-gray-500">{destError}</p>
                ) : (
                  <div className="h-56 w-full animate-pulse rounded-xl bg-gray-100" />
                )}
              </section>
            )}
            <section>
              <h2 className="mb-4 text-sm font-bold text-[#353535]">Delivery Address</h2>
              <div className="rounded-xl border border-[#e4e1df] bg-white p-4 text-[10px] leading-relaxed text-[#555]">
                <p className="text-[#888]">{order.profiles?.full_name || "Customer"}</p>
                <p>{order.delivery_address || (order.order_type === "pickup" ? "Store pickup" : "No address on file")}</p>
                {order.customer_phone && <p>{order.customer_phone}</p>}
              </div>
            </section>
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#353535]"><PackageCheck size={15} />Payment details</h2>
              <div className="rounded-xl bg-[#fffaf7] p-4 text-[10px] text-[#555]">
                {order.order_items.map((item) => <div key={item.id} className="flex justify-between gap-3 py-1"><span>{item.product_name}</span><span>{formatPrice(item.unit_price * item.quantity)}</span></div>)}
                <div className="mt-2 flex justify-between border-t border-dotted border-[#cfc8c4] pt-2"><span>Delivery</span><span>{formatPrice(order.delivery_fee)}</span></div>
                <div className="mt-2 flex justify-between border-t border-[#cfc8c4] pt-3 font-bold text-[#333]"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                <p className="mt-2 text-[9px] text-[#75a62b]">Paid with {order.payment_method}</p>
              </div>
            </section>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 hover:bg-red-100"
            >
              <AlertTriangle size={14} /> Report a problem
            </button>
          </aside>
        </div>
      </main>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setReportOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {reportSent ? (
              <div className="py-4 text-center">
                <CheckCircle2 size={32} className="mx-auto text-[#16A34A]" />
                <p className="mt-3 text-sm font-black text-gray-900">Report sent</p>
                <p className="mt-1 text-xs text-gray-500">Our support team will look into this and get back to you.</p>
                <button onClick={() => setReportOpen(false)} className="mt-5 w-full rounded-full bg-[#073729] py-3 text-xs font-bold text-white">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900">Report a problem</h3>
                  <button type="button" onClick={() => setReportOpen(false)} aria-label="Close" className="rounded-full bg-gray-100 p-2"><X size={16} /></button>
                </div>
                {reportError && <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-600">{reportError}</p>}
                <label className="block text-xs font-bold text-gray-700">
                  What went wrong?
                  <select required value={reportSubject} onChange={(e) => setReportSubject(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 text-sm">
                    <option value="">Select an issue</option>
                    <option value="Missing items">Missing items</option>
                    <option value="Wrong items delivered">Wrong items delivered</option>
                    <option value="Poor quality produce">Poor quality produce</option>
                    <option value="Late delivery">Late delivery</option>
                    <option value="Overcharged">Overcharged</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-gray-700">
                  Details (optional)
                  <textarea rows={3} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Tell us more..." className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 p-2.5 text-sm" />
                </label>
                <button type="submit" disabled={reportSubmitting || !reportSubject} className="w-full rounded-full bg-[#073729] py-3 text-xs font-black text-white disabled:opacity-60">
                  {reportSubmitting ? "Sending..." : "Send report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
