
import Link from "@/lib/next-compat/link";
import { usePathname } from "@/lib/next-compat/navigation";
import {
  Leaf,
  ShieldCheck,
  Truck,
  Phone,
  MapPin,
  Store,
  CreditCard,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on seller/admin dashboards, the full-screen AI page, onboarding,
  // and any page with its own fixed bottom action bar — a fixed-position bar
  // stays pinned to the viewport while the footer scrolls freely underneath it,
  // so the two can't coexist without the bar appearing to float over the footer.
  if (
    (pathname.startsWith("/seller") && pathname !== "/seller/register") ||
    pathname.startsWith("/admin") ||
    pathname === "/assistant" ||
    pathname === "/welcome" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/products/")
  ) {
    return null;
  }

  return (
    <footer className="bg-[#073729] text-white pt-12 pb-24 md:pb-12 border-t border-emerald-900/50 transition-all">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8 mb-8 border-b border-emerald-800/40">
          <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 text-[#84CC16] flex items-center justify-center flex-shrink-0">
              <Truck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-black text-white">30-Min Delivery</p>
              <p className="text-[10px] text-emerald-200/70">From local stalls to your door</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 text-[#84CC16] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-black text-white">Handpicked Quality</p>
              <p className="text-[10px] text-emerald-200/70">100% fresh morning harvest</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 text-[#84CC16] flex items-center justify-center flex-shrink-0">
              <CreditCard size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-black text-white">M-Pesa STK Push</p>
              <p className="text-[10px] text-emerald-200/70">Instant & verified mobile payment</p>
            </div>
          </div>
        </div>

        {/* Brand & Main Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-3">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#84CC16] text-[#073729] flex items-center justify-center font-black shadow-xs">
                <Leaf size={18} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-black tracking-tight text-white">MamaFresh</span>
            </Link>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Empowering neighborhood mama mbogas with direct digital commerce. Fresh produce, fair earnings, fast doorstep delivery.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#84CC16] font-bold">
              <MapPin size={13} />
              <span>Nairobi, Kenya · Serving East Africa</span>
            </div>
          </div>

          {/* Quick Shop */}
          <div className="space-y-2.5">
            <p className="text-xs font-black text-[#84CC16] uppercase tracking-wider">
              Marketplace
            </p>
            <ul className="space-y-1.5 text-xs text-emerald-100/80 font-medium">
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  All Groceries
                </Link>
              </li>
              <li>
                <Link href="/shops" className="hover:text-white transition-colors">
                  Neighborhood Stalls
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Exclusive Offers</span>
                  <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                    30% Off
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-white transition-colors">
                  Saved Favorites
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track Past Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="space-y-2.5">
            <p className="text-xs font-black text-[#84CC16] uppercase tracking-wider">
              Support
            </p>
            <ul className="space-y-1.5 text-xs text-emerald-100/80 font-medium">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li className="pt-1">
                <a
                  href="tel:+254793046776"
                  className="inline-flex items-center gap-1.5 text-[#84CC16] font-bold hover:underline"
                >
                  <Phone size={12} />
                  <span>+254 793 046 776</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Partners & Sellers */}
          <div className="space-y-2.5">
            <p className="text-xs font-black text-[#84CC16] uppercase tracking-wider">
              Partners
            </p>
            <ul className="space-y-1.5 text-xs text-emerald-100/80 font-medium">
              <li>
                <Link
                  href="/seller"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Store size={13} className="text-[#84CC16]" />
                  <span>Mama Mboga Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/seller/register"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Sparkles size={13} className="text-[#84CC16]" />
                  <span>Register a Produce Stall</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-white transition-colors flex items-center gap-1 text-emerald-300"
                >
                  <ShieldCheck size={13} />
                  <span>Operations Admin</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-6 border-t border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-emerald-200/60">
          <p>© {new Date().getFullYear()} MamaFresh Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-white transition-colors">
              Terms & Privacy
            </Link>
            <span aria-hidden="true">|</span>
            <span className="flex items-center gap-1 text-white/80">
              <span>Made with care for Nairobi</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
