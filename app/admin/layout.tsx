"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  Settings,
  Home,
  AlertTriangle,
  Star,
  Tag,
  MapPin,
  Wallet,
  Megaphone,
  Bell,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

const ADMIN_NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  { label: "", items: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
  ] },
  { label: "Marketplace", items: [
    { href: "/admin/sellers", label: "Sellers", icon: Store },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tag },
  ] },
  { label: "Operations", items: [
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/locations", label: "Locations", icon: MapPin },
  ] },
  { label: "Finance", items: [
    { href: "/admin/finance", label: "Finance", icon: Wallet },
  ] },
  { label: "Growth", items: [
    { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  ] },
  { label: "System", items: [
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/admin-users", label: "Admin Users", icon: UserCog },
  ] },
];

const ADMIN_NAV = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, signedIn, loading } = useIsAdmin();

  useEffect(() => {
    if (loading) return;
    if (!signedIn) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; }
    if (!isAdmin) router.replace("/home");
  }, [loading, signedIn, isAdmin, pathname, router]);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <p className="text-xs font-bold text-gray-400">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="admin-view min-h-screen bg-[#F3F4F6] flex font-sans antialiased text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#073729] text-white flex-shrink-0 flex flex-col justify-between hidden md:flex border-r border-white/10">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                <Image src="/favico.png" alt="MamaFresh" fill className="object-cover" sizes="36px" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight">MamaFresh Admin</span>
                <p className="text-[10px] text-emerald-300 font-semibold">Operations & Marketplace</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="max-h-[calc(100vh-96px)] space-y-4 overflow-y-auto p-4">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.label || "root"} className="space-y-1.5">
                {group.label && (
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/40">{group.label}</p>
                )}
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all",
                        active
                          ? "bg-[#84CC16] text-[#073729] shadow-xs"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Switcher */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/home"
            className="flex items-center justify-between text-xs text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span>Customer Marketplace</span>
            <ExternalLink size={13} />
          </Link>
          <Link
            href="/seller"
            className="flex items-center justify-between text-xs text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span>Mama Mboga Dashboard</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </aside>

      {/* Main Admin Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Navigation Header */}
        <div className="bg-[#073729] text-white p-4 flex items-center gap-3 md:hidden sticky top-0 z-30 shadow-sm min-w-0">
          <Link href="/home" aria-label="Back to home" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Home size={15} />
          </Link>
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
              <Image src="/favico.png" alt="MamaFresh" fill className="object-cover" sizes="28px" />
            </div>
            <span className="text-sm font-black whitespace-nowrap">MamaFresh Admin</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none">
            {ADMIN_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors",
                  pathname === href ? "bg-[#84CC16] text-[#073729]" : "text-white/80 hover:text-white"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 min-w-0 w-full p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
