"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Home, Store, Heart, ShoppingCart, Truck, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home",      label: "Home",      icon: Home },
  { href: "/shops",     label: "Shops",     icon: Store },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/cart",      label: "Cart",      icon: ShoppingCart, isCart: true },
  { href: "/orders",    label: "Orders",    icon: Truck },
  { href: "/account",   label: "Account",   icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const totalItems = useCartStore((s) => s.getTotalItems());

  // Only hide on internal seller/admin dashboards and full-screen pages (AI chat, messaging)
  if (path.startsWith("/seller") || path.startsWith("/admin") || path === "/assistant" || path.startsWith("/messages")) {
    return null;
  }

  return (
    <nav
      aria-label="Bottom Navigation"
      className="bottom-nav fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] z-40 bg-[#073729]/95 backdrop-blur-lg rounded-full border border-emerald-800/60 shadow-[0_12px_35px_rgba(0,0,0,0.28)] px-2.5 py-1.5 flex items-center justify-between transition-all"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, isCart }) => {
        const active =
          path === href ||
          (href !== "/home" && path.startsWith(href)) ||
          (href === "/home" && (path === "/home" || path === "/"));

        return (
          <Link
            key={href}
            href={href}
            id={`bottom-nav-${label.toLowerCase()}`}
            aria-label={label}
            className={cn(
              "relative w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-90",
              active
                ? "bg-[#84CC16] text-[#073729] shadow-md scale-105"
                : "text-emerald-200/80 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon
              size={18}
              strokeWidth={active ? 2.5 : 2}
              fill={active && (label === "Home" || label === "Favorites") ? "currentColor" : "none"}
            />
            <span
              className={cn(
                "text-[9px] font-extrabold tracking-tight mt-0.5 leading-none",
                active ? "text-[#073729]" : "text-emerald-200/70"
              )}
            >
              {label}
            </span>

            {/* Cart Badge */}
            {isCart && hydrated && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-[#073729]">
                {totalItems}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
