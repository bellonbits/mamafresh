
import React from "react";

interface FormattedPriceProps {
  price: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  colorClass?: string;
}

export default function FormattedPrice({
  price,
  currency = "KSh",
  size = "md",
  className = "",
  colorClass = "text-[#073729]",
}: FormattedPriceProps) {
  const formattedAmount = Number(price || 0).toLocaleString("en-KE");

  let wholeSize = "text-base font-black tracking-tight";
  let curSize = "text-xs font-bold";

  if (size === "sm") {
    wholeSize = "text-sm font-black";
    curSize = "text-[10px] font-bold";
  } else if (size === "md") {
    wholeSize = "text-base font-black tracking-tight";
    curSize = "text-xs font-bold";
  } else if (size === "lg") {
    wholeSize = "text-xl font-black tracking-tight";
    curSize = "text-sm font-bold";
  } else if (size === "xl") {
    wholeSize = "text-2xl font-black tracking-tight";
    curSize = "text-base font-bold";
  }

  return (
    <span className={`inline-flex items-baseline gap-1 ${colorClass} ${className}`}>
      <span className={curSize}>{currency}</span>
      <span className={wholeSize}>{formattedAmount}</span>
    </span>
  );
}
