"use client";

import { CheckCircle2, Phone, MapPin, Navigation } from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import { useLiveLocationSharing } from "@/lib/hooks/useLiveLocationSharing";
import type { OrderRow, OrderItemRow, OrderStatus } from "@/lib/supabase/types";

type OrderWithItems = OrderRow & { order_items: OrderItemRow[]; profiles: { full_name: string } | null };

interface Props {
  order: OrderWithItems;
  action?: { next: OrderStatus; label: string };
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export default function SellerOrderCard({ order: ord, action, onUpdateStatus }: Props) {
  const { sharing, error: locationError, start, stop } = useLiveLocationSharing(ord.id);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900">#{ord.id.slice(0, 8).toUpperCase()}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              ord.status === "pending" && "bg-amber-100 text-amber-700",
              ord.status === "accepted" && "bg-blue-100 text-blue-700",
              ord.status === "preparing" && "bg-purple-100 text-purple-700",
              (ord.status === "ready" || ord.status === "out_for_delivery") && "bg-emerald-100 text-emerald-700",
              ord.status === "delivered" && "bg-gray-100 text-gray-600",
              ord.status === "cancelled" && "bg-red-100 text-red-600"
            )}>
              {ord.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{new Date(ord.created_at).toLocaleString()}</p>
        </div>

        <p className="text-sm font-black text-[#0B3D2E]">
          {formatKSh(ord.total)}
        </p>
      </div>

      {/* Customer & Location */}
      <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl text-xs">
        <div>
          <p className="font-bold text-gray-800">{ord.profiles?.full_name || "Customer"}</p>
          <p className="text-gray-500 text-[11px] flex items-center gap-1">
            <MapPin size={11} className="text-gray-400" /> {ord.delivery_address || (ord.order_type === "pickup" ? "Store pickup" : "—")}
          </p>
        </div>
        {ord.customer_phone && (
          <a
            href={`tel:${ord.customer_phone}`}
            className="w-7 h-7 rounded-full bg-white border border-gray-200 text-[#16A34A] flex items-center justify-center shadow-xs"
          >
            <Phone size={13} />
          </a>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1 text-xs">
        {ord.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-gray-700">
            <span>{item.quantity}x {item.product_name}</span>
            <span className="text-gray-400">{formatKSh(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Live location sharing — once the order is out for delivery */}
      {ord.status === "out_for_delivery" && ord.order_type === "delivery" && (
        <div className="rounded-xl border border-emerald-100 bg-[#EAF7EE] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#15803d]">
              <Navigation size={12} className={sharing ? "animate-pulse" : ""} />
              {sharing ? "Sharing your live location with the customer" : "Customer can see you on a map once you share"}
            </span>
            <button
              type="button"
              onClick={sharing ? stop : start}
              className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black", sharing ? "bg-white text-red-600" : "bg-[#073729] text-white")}
            >
              {sharing ? "Stop sharing" : "Share location"}
            </button>
          </div>
          {locationError && <p className="mt-1 text-[10px] font-semibold text-red-600">{locationError}</p>}
        </div>
      )}

      {/* Action Buttons based on order stage */}
      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
        {ord.status === "pending" && (
          <button
            onClick={() => onUpdateStatus(ord.id, "cancelled")}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"
          >
            Reject
          </button>
        )}
        {action && (
          <button
            onClick={() => onUpdateStatus(ord.id, action.next)}
            className="flex-1 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {action.label}
          </button>
        )}
        {ord.status === "delivered" && (
          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mx-auto">
            <CheckCircle2 size={13} className="text-[#16A34A]" /> Delivered to Customer
          </span>
        )}
        {ord.status === "cancelled" && (
          <span className="text-xs font-semibold text-red-400 mx-auto">Cancelled</span>
        )}
      </div>
    </div>
  );
}
