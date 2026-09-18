"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Home, Heart, ShoppingCart, FileText, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

const SIDE_ITEMS = [
  { href: "/home",      label: "Home",     icon: Home },
  { href: "/favorites", label: "Favorite", icon: Heart },
  { href: "/orders",    label: "Order",    icon: FileText },
  { href: "/account",   label: "Account",  icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const totalItems = useCartStore((s) => s.getTotalItems());
  const cartActive = path.startsWith("/cart");

  // Only hide on internal seller/admin dashboards and full-screen pages (AI chat, messaging)
  if (path.startsWith("/seller") || path.startsWith("/admin") || path === "/assistant" || path.startsWith("/messages")) {
    return null;
  }

  const [left, right] = [SIDE_ITEMS.slice(0, 2), SIDE_ITEMS.slice(2)];

  const renderItem = ({ href, label, icon: Icon }: (typeof SIDE_ITEMS)[number]) => {
    const active =
      path === href ||
      (href === "/home" && (path === "/home" || path === "/")) ||
      (href === "/account" && path.startsWith("/account")) ||
      (href === "/orders" && path.startsWith("/orders")) ||
      (href === "/favorites" && path.startsWith("/favorites"));

    return (
      <Link
        key={href}
        href={href}
        id={`bottom-nav-${label.toLowerCase()}`}
        aria-label={label}
        className="relative flex w-14 flex-col items-center justify-center gap-1 py-1 transition-transform active:scale-90"
      >
        <Icon size={19} strokeWidth={active ? 2.4 : 2} className={active ? "text-[#16A34A]" : "text-gray-400"} />
        <span className={cn("text-[10px] font-bold", active ? "text-[#16A34A]" : "text-gray-400")}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="bottom-nav fixed bottom-0 left-0 z-40 w-full bg-white px-2 pt-2 shadow-[0_-8px_25px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="relative flex items-center justify-around">
        {left.map(renderItem)}

        {/* Raised cart FAB */}
        <Link
          href="/cart"
          id="bottom-nav-cart"
          aria-label="Cart"
          className="relative -mt-8 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-[0_8px_20px_rgba(22,163,74,0.45)] transition-transform active:scale-90"
        >
          <ShoppingCart size={22} strokeWidth={cartActive ? 2.4 : 2} />
          {hydrated && totalItems > 0 && (
            <span className="absolute -top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E84919] px-1 text-[10px] font-black text-white ring-2 ring-white">
              {totalItems}
            </span>
          )}
        </Link>

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
