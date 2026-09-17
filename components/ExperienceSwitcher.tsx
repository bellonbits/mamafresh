"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Store, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExperienceSwitcher() {
  const pathname = usePathname();

  const isFirstPage = pathname === "/";
  const isCustomer = (pathname === "/home" || pathname.startsWith("/shops") || pathname.startsWith("/products") || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders") || pathname.startsWith("/account")) && !isFirstPage;
  const isSeller = pathname.startsWith("/seller");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <aside
      aria-label="Role Switcher"
      className="fixed top-2.5 right-3 z-50 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-2xl scale-90 sm:scale-100 transition-all hover:scale-105"
    >
      <Link
        href="/"
        className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
          isFirstPage
            ? "bg-[#84CC16] text-[#073729] shadow-xs"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <Sparkles size={12} />
        <span className="hidden xs:inline sm:inline">First Page</span>
      </Link>

      <Link
        href="/home"
        className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
          isCustomer
            ? "bg-[#84CC16] text-[#073729] shadow-xs"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <ShoppingBag size={12} />
        <span className="hidden xs:inline sm:inline">Customer</span>
      </Link>

      <Link
        href="/seller"
        className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
          isSeller
            ? "bg-[#84CC16] text-[#073729] shadow-xs"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <Store size={12} />
        <span className="hidden xs:inline sm:inline">Mama Mboga</span>
      </Link>

      <Link
        href="/admin"
        className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
          isAdmin
            ? "bg-[#84CC16] text-[#073729] shadow-xs"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <ShieldAlert size={12} />
        <span className="hidden xs:inline sm:inline">Admin</span>
      </Link>
    </aside>
  );
}
