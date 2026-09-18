
import { useState } from "react";
import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { Heart, Menu, ShoppingCart, Sparkles, UserRound, X } from "lucide-react";
import { usePathname } from "@/lib/next-compat/navigation";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const path = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [showMenu, setShowMenu] = useState(false);

  const hasOwnHeader =
    path === "/" ||
    path === "/home" ||
    path === "/welcome" ||
    path === "/offers" ||
    path.startsWith("/seller") ||
    path.startsWith("/admin") ||
    path.startsWith("/products/") ||
    path.startsWith("/shops/") ||
    path.startsWith("/sellers/") ||
    path === "/location" ||
    path === "/cart" ||
    path === "/checkout" ||
    path === "/assistant";

  if (hasOwnHeader) return null;

  return (
    <header className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
        <Link href="/home" className="flex h-12 w-[132px] shrink-0 items-center sm:w-[150px]">
          <Image
            src="/logo.png"
            alt="MamaFresh"
            width={300}
            height={200}
            priority
            className="h-full w-full object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 lg:flex">
          <Link href="/home" className={path === "/home" ? "text-[#16A34A]" : "hover:text-[#16A34A]"}>Home</Link>
          <Link href="/shops" className={path.startsWith("/shops") ? "text-[#16A34A]" : "hover:text-[#16A34A]"}>Shop</Link>
          <Link href="/offers" className={path === "/offers" ? "text-[#16A34A]" : "hover:text-[#16A34A]"}>Offers</Link>
          <Link href="/assistant" className={cn("flex items-center gap-1", path === "/assistant" ? "text-[#16A34A]" : "hover:text-[#16A34A]")}><Sparkles size={14} /> MamaFresh AI</Link>
          <Link href="/about" className={path === "/about" ? "text-[#16A34A]" : "hover:text-[#16A34A]"}>About</Link>
          <Link href="/contact" className={path === "/contact" ? "text-[#16A34A]" : "hover:text-[#16A34A]"}>Contact</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/favorites" aria-label="Favorites" className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 sm:flex"><Heart size={18} /></Link>
          <Link href="/cart" aria-label="Shopping cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#073729]"><ShoppingCart size={18} /><span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{totalItems}</span></Link>
          <Link href="/account" aria-label="Account" className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#073729] text-white sm:flex"><UserRound size={17} /></Link>
          <button onClick={() => setShowMenu(!showMenu)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#073729] lg:hidden">{showMenu ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>

      {showMenu && <nav className="border-t border-gray-100 px-5 py-3 lg:hidden"><div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-gray-600"><Link href="/home">Home</Link><Link href="/shops">Shop</Link><Link href="/offers">Offers</Link><Link href="/assistant" className="flex items-center gap-1 text-[#16A34A]"><Sparkles size={14} /> MamaFresh AI</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div></nav>}
    </header>
  );
}
