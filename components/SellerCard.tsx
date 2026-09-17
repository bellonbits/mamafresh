"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerRow, SellerStats } from "@/lib/supabase/types";

interface SellerCardProps {
  seller: SellerRow;
  stats?: SellerStats;
  className?: string;
}

export default function SellerCard({ seller, stats, className }: SellerCardProps) {
  return (
    <Link
      href={`/shops/${seller.slug}`}
      className={cn(
        "card flex flex-col overflow-hidden group cursor-pointer hover:shadow-card-hover transition-all duration-200",
        className
      )}
    >
      {/* Banner */}
      <div className="relative w-full h-24 bg-brand-dark overflow-hidden">
        <Image
          src={seller.banner_url || "/images/hero.jpg"}
          alt={seller.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
          sizes="(max-width: 480px) 100vw, 300px"
        />
        {/* Open/Closed badge */}
        <span
          className={cn(
            "absolute top-2 right-2 badge text-xs",
            seller.is_open
              ? "bg-brand-500 text-white"
              : "bg-gray-500 text-white"
          )}
        >
          {seller.is_open ? "Open" : "Closed"}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
          {seller.name}
        </h3>

        <div className="flex items-center gap-1">
          <Star size={12} className="text-amber-400" fill="currentColor" />
          <span className="text-xs font-semibold text-gray-700">{stats?.rating ?? 0}</span>
          <span className="text-xs text-gray-400">({stats?.total_reviews ?? 0})</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={11} />
          <span className="truncate">{seller.estate || seller.location}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 pt-0.5">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {seller.opening_time}–{seller.closing_time}
          </span>
          {seller.delivery_available && (
            <span className="badge badge-green">Delivery</span>
          )}
          {seller.pickup_available && (
            <span className="badge bg-blue-100 text-blue-700">Pickup</span>
          )}
        </div>
      </div>
    </Link>
  );
}
