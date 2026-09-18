"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Heart, Star } from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { getDefaultProductImage } from "@/lib/mock-data";
import { useFavorites } from "@/lib/hooks/useFavorites";
import type { ProductRow } from "@/lib/supabase/types";

interface ProductCardProps {
  product: ProductRow;
  className?: string;
  onConflict?: () => void;
}

export default function ProductCard({ product, className, onConflict }: ProductCardProps) {
  const { items, addItem, updateQty } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const { favoriteIds, toggle } = useFavorites();
  const liked = favoriteIds.has(product.id);
  const [imgSrc, setImgSrc] = useState(
    product.image_url || getDefaultProductImage(product.name, product.category)
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { conflict } = addItem(product, 1);
    if (conflict && onConflict) onConflict();
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, Math.max(0, qty - 1));
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, qty + 1);
  };

  const toggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "bg-white rounded-2xl p-2.5 shadow-xs border border-gray-100 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all active:scale-[0.99] relative",
        className
      )}
    >
      {/* Product Image — plain tile; discount tag + heart overlaid, "+" button anchored to the corner */}
      <div className="relative w-full aspect-square">
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-gray-50">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="160px"
            onError={() => setImgSrc(getDefaultProductImage(product.name, product.category))}
          />
          {product.discount_tag && (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black tracking-tight text-[#16A34A] shadow-xs">
              {product.discount_tag}
            </span>
          )}
          <button
            onClick={toggleHeart}
            aria-label="Favorite"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-300 shadow-xs transition-colors hover:text-red-500 active:scale-90"
          >
            <Heart size={12} className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <span className="text-[10px] font-bold text-gray-400">Sold out</span>
            </div>
          )}
        </div>

        {/* Add-to-cart control — a black "+" FAB anchored to the image corner; becomes a stepper once in cart */}
        {qty > 0 ? (
          <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="absolute -bottom-3 right-2 flex items-center gap-1.5 rounded-full bg-[#073729] px-1 py-1 shadow-md"
          >
            <button onClick={handleMinus} aria-label="Decrease" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white active:scale-90">
              <Minus size={11} strokeWidth={3} />
            </button>
            <span className="min-w-3 text-center text-xs font-bold text-white">{qty}</span>
            <button onClick={handlePlus} aria-label="Increase" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#073729] active:scale-90">
              <Plus size={11} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!product.is_available}
            aria-label={`Add ${product.name} to cart`}
            className="absolute -bottom-3 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#073729] text-white shadow-md transition-transform hover:scale-105 active:scale-90 disabled:opacity-40"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Product Details */}
      <div className="mt-4 w-full">
        <div className="flex items-center justify-between gap-1">
          <h3 className="line-clamp-1 text-xs font-bold text-gray-900 leading-tight transition-colors group-hover:text-[#073729]">
            {product.name}
          </h3>
          {product.rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-amber-500">
              <Star size={9} fill="currentColor" /> {product.rating}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-gray-400">{product.weight || `${product.minimum_quantity} ${product.unit}`}</p>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-sm font-black text-[#073729]">{formatKSh(product.price)}</span>
          {product.original_price > product.price && (
            <span className="text-[10px] font-medium text-gray-400 line-through">{formatKSh(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
