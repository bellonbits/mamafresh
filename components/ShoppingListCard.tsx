"use client";

import Image from "next/image";
import { Plus, ShoppingCart } from "lucide-react";
import { formatKSh } from "@/lib/utils";
import type { ShoppingListItem } from "@/lib/hooks/useAssistantChat";

interface ShoppingListCardProps {
  items: ShoppingListItem[];
  onAdd: (item: ShoppingListItem) => void;
  onAddAll: (items: ShoppingListItem[]) => void;
}

export default function ShoppingListCard({ items, onAdd, onAddAll }: ShoppingListCardProps) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2 space-y-1.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-50">
            <Image src={item.image_url} alt={item.name} fill className="object-contain p-0.5" sizes="32px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-gray-800">{item.quantity} × {item.name}</p>
            <p className="text-[10px] text-gray-400">{formatKSh(item.price)} / {item.unit} · {item.seller_name}</p>
          </div>
          <button onClick={() => onAdd(item)} aria-label={`Add ${item.name} to cart`} className="shrink-0 rounded-full bg-[#16A34A] p-1.5 text-white active:scale-90"><Plus size={12} /></button>
        </div>
      ))}
      <button onClick={() => onAddAll(items)} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#073729] px-3 py-2 text-xs font-bold text-white">
        <ShoppingCart size={13} /> Add all to cart
      </button>
    </div>
  );
}
