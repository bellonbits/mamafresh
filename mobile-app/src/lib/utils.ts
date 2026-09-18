// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKSh(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function formatQty(qty: number, unit: string): string {
  if (unit === "kg" || unit === "g" || unit === "litre") {
    return `${qty} ${unit}`;
  }
  return qty === 1 ? `${qty} ${unit}` : `${qty} ${unit}s`;
}

export function getStarArray(rating: number): (1 | 0 | 0.5)[] {
  return Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return 1;
    if (rating >= i + 0.5) return 0.5;
    return 0;
  });
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}
