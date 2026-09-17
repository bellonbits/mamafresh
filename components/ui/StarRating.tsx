"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  size = 14,
  showNumber = false,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return "full";
    if (rating >= i + 0.5) return "half";
    return "empty";
  });

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {stars.map((type, i) => (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="text-gray-200 absolute inset-0"
              fill="currentColor"
            />
            {type === "full" && (
              <Star size={size} className="text-amber-400 absolute inset-0" fill="currentColor" />
            )}
            {type === "half" && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: "50%" }}
              >
                <Star size={size} className="text-amber-400" fill="currentColor" />
              </span>
            )}
          </span>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
