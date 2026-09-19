import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { useRouter, useParams } from "@/lib/next-compat/navigation";
import { ChevronLeft, MapPin, Navigation, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLiveLocationSharing } from "@/lib/hooks/useLiveLocationSharing";
import { cn, formatKSh } from "@/lib/utils";
import type { OrderRow } from "@/lib/supabase/types";

export default function DeliveryShareLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { sharing, error, start, stop } = useLiveLocationSharing(id ?? "");

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = () => {
      void getSupabaseBrowserClient().from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (active) { setOrder(data as OrderRow | null); setLoading(false); }
      });
    };
    load();
    // Refresh the "last updated" timestamp shown on screen while sharing.
    const interval = setInterval(load, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">Order not found</p>
        <Link href="/deliver" className="rounded-full bg-[#073729] px-5 py-2.5 text-xs font-bold text-white">Back to deliveries</Link>
      </div>
    );
  }

  const lastUpdated = order.seller_location_updated_at ? new Date(order.seller_location_updated_at) : null;

  return (
    <div className="bg-[#FFFDF7] animate-fade-in">
      <header className="px-4 py-3 flex items-center gap-3 sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-xs border-b border-gray-100">
        <button onClick={() => router.back()} aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-black text-[#073729]">Share delivery location</h1>
      </header>

      <div className="mx-auto max-w-md px-4 py-5 space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#16A34A]" />
            <span>{order.delivery_address}</span>
          </div>
          <p className="mt-2 text-sm font-black text-[#073729]">{formatKSh(order.total)}</p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center">
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full transition-colors",
            sharing ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-gray-100 text-gray-400"
          )}>
            <Navigation size={32} className={sharing ? "animate-pulse" : ""} />
          </div>

          <p className="mt-4 text-sm font-bold text-gray-900">
            {sharing ? "Sharing your live location" : "Not sharing your location"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-gray-400">
            {sharing
              ? "The customer can see you moving toward their address in real time. Keep this screen open while you deliver."
              : "Start sharing so the customer can track you on the map and see an ETA."}
          </p>
          {lastUpdated && sharing && (
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
              <CheckCircle2 size={11} /> Last updated {lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {error && (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          <button
            onClick={sharing ? stop : start}
            className={cn(
              "mt-5 w-full rounded-full py-3 text-xs font-black transition-colors",
              sharing ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-[#073729] text-white hover:bg-[#0B3D2E]"
            )}
          >
            {sharing ? "Stop sharing" : "Start sharing my location"}
          </button>
        </div>
      </div>
    </div>
  );
}
