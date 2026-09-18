
import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { Heart, HelpCircle, MapPin, ShoppingBag, User } from "lucide-react";
import { usePathname } from "@/lib/next-compat/navigation";
import { cn } from "@/lib/utils";

const CUSTOMER_NAV = [
  { href: "/account", label: "My Profile", icon: User },
  { href: "/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/location", label: "Saved Addresses", icon: MapPin },
  { href: "/favorites", label: "My Favorites", icon: Heart },
  { href: "/help", label: "Help & Support", icon: HelpCircle },
];

export default function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:block">
      <Link href="/home" className="mb-7 flex items-center gap-3 px-2">
        <Image src="/logo.png" alt="MamaFresh" width={38} height={38} className="h-9 w-9 object-contain" />
        <div>
          <p className="text-lg font-black leading-tight text-[#073729]">MamaFresh</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#E85D04]">Customer Portal</p>
        </div>
      </Link>

      <nav className="space-y-1">
        {CUSTOMER_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-colors",
                isActive
                  ? "border border-emerald-100 bg-emerald-50 text-[#073729]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#073729]"
              )}
            >
              <Icon size={17} className={isActive ? "text-[#073729]" : "text-slate-400"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
