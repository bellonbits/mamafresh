"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Heart, Star } from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import FormattedPrice from "@/components/FormattedPrice";
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
        "bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all active:scale-[0.99] relative",
        className
      )}
    >
      {/* Top Row: Discount Tag + Heart Toggle */}
      <div className="flex items-center justify-between w-full z-10">
        {product.discount_tag ? (
          <span className="px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#16A34A] text-[10px] font-black tracking-tight">
            {product.discount_tag}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
            Fresh
          </span>
        )}

        <button
          onClick={toggleHeart}
          aria-label="Favorite"
          className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shadow-xs active:scale-90"
        >
          <Heart
            size={14}
            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative w-full h-28 my-1 flex items-center justify-center">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
          sizes="160px"
          onError={() => setImgSrc(getDefaultProductImage(product.name, product.category))}
        />
        {!product.is_available && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400">Sold out</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="w-full mt-1">
        <h3 className="text-xs font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#073729] transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium mt-0.5">
          <span>{product.weight || `${product.minimum_quantity} ${product.unit}`}</span>
          {product.rating && (
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star size={10} fill="currentColor" /> {product.rating}
            </span>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-[#073729]">
              {formatKSh(product.price)}
            </span>
            {product.original_price && (
              <span className="text-[10px] text-gray-400 line-through font-medium">
                {formatKSh(product.original_price)}
              </span>
            )}
          </div>

          {/* Stepper or Round Plus Button */}
          {qty > 0 ? (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="bg-[#B6E2BA] rounded-full py-0.5 px-1 flex items-center gap-1.5"
            >
              <button
                onClick={handleMinus}
                aria-label="Decrease"
                className="w-5 h-5 rounded-full bg-white text-[#16A34A] flex items-center justify-center font-bold text-xs shadow-xs active:scale-90"
              >
                <Minus size={10} strokeWidth={3} />
              </button>
              <span className="font-bold text-xs text-[#073729] min-w-2.5 text-center">
                {qty}
              </span>
              <button
                onClick={handlePlus}
                aria-label="Increase"
                className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-90"
              >
                <Plus size={10} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!product.is_available}
              aria-label={`Add ${product.name} to cart`}
              className="w-7 h-7 rounded-full bg-[#073729] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-xs active:scale-90 transition-colors disabled:opacity-40"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
