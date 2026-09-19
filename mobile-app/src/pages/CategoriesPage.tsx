import Link from "@/lib/next-compat/link";
import Image from "@/lib/next-compat/image";
import { CATEGORIES } from "@/lib/mock-data";
import CategoryIcon from "@/components/CategoryIcon";
import { ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="animate-fade-in bg-[#F4F6F5]">
      {/* Header with logo */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Image src="/logo.png" alt="MamaFresh" width={32} height={32} className="rounded-xl" />
        <h1 className="text-base font-black text-[#073729]">All Categories</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">

        {/* Hero banner using homee_card.png */}
        <div className="relative overflow-hidden rounded-3xl min-h-[140px] sm:min-h-[180px] bg-[#073729]">
          <Image
            src="/homee_card.png"
            alt="Fresh produce"
            fill
            className="object-cover object-center opacity-80"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#073729] via-[#073729]/70 to-transparent" />
          <div className="relative z-10 px-6 py-7">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#B8EF4A] mb-1">MamaFresh</p>
            <h2 className="text-2xl font-black text-white leading-tight">Shop by<br />Category</h2>
            <p className="text-xs text-emerald-100/80 mt-1.5">Fresh from neighborhood stalls</p>
          </div>
        </div>

        {/* All categories grid */}
        <div>
          <h2 className="text-sm font-black text-[#073729] mb-4">Browse All</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* All */}
            <Link
              href="/shops"
              className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#16A34A]/40 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="transition-transform group-hover:scale-105">
                <CategoryIcon slug="all" size={56} />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-[#073729] transition-colors leading-tight">
                All Products
              </span>
            </Link>

            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#16A34A]/40 transition-all flex flex-col items-center gap-2 text-center"
              >
                <div className="transition-transform group-hover:scale-105">
                  <CategoryIcon slug={cat.slug} size={56} />
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#073729] transition-colors leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick explore card */}
        <Link
          href="/shops"
          className="flex items-center justify-between bg-[#073729] text-white rounded-2xl px-5 py-4"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#B8EF4A]">Quick shop</p>
            <p className="text-sm font-black mt-0.5">Browse all products</p>
          </div>
          <ChevronRight size={20} className="text-[#B8EF4A]" />
        </Link>

      </div>
    </div>
  );
}
