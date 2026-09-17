import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Store } from "lucide-react";
import { CATEGORIES } from "@/lib/mock-data";
import ProductCard from "@/components/ProductCard";
import CategoryIcon from "@/components/CategoryIcon";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .or(`category_slug.eq.${slug},category.ilike.${category.name}`)
    : { data: [] };
  const products = (data ?? []) as ProductRow[];

  return (
    <div className="min-h-screen bg-[#F4F6F5] pb-28 animate-fade-in">
      {/* Category Header */}
      <div className="bg-[#073729] text-white px-4 sm:px-6 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/categories"
              aria-label="Back to all categories"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <Link href="/home" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/categories" className="hover:underline">Categories</Link>
              <span>/</span>
              <span className="text-white font-bold">{category.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CategoryIcon slug={category.slug} size={64} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{category.name}</h1>
                <span className="text-[10px] font-bold bg-[#84CC16] text-[#073729] px-2 py-0.5 rounded-full">
                  {category.priority}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">

        {/* Subcategories Breakdown Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-[#16A34A]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
              Kenyan Household Classifications & Items
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {category.subcategories.map((sub) => (
              <div
                key={sub.id}
                className="bg-[#F8FAF9] rounded-xl p-3 border border-gray-100"
              >
                <h3 className="font-bold text-xs text-[#073729] mb-1.5 flex items-center justify-between">
                  <span>{sub.name}</span>
                  <span className="text-[10px] font-normal text-gray-400">
                    {sub.items.length} items
                  </span>
                </h3>
                <div className="flex flex-wrap gap-1">
                  {sub.items.map((item) => (
                    <span
                      key={item}
                      className="text-[10px] font-medium bg-white border border-gray-200/60 text-gray-700 px-2 py-0.5 rounded-md"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Available From Local Stalls
              </h2>
              <p className="text-xs text-gray-500">
                {products.length} fresh products ready for 30-min delivery
              </p>
            </div>
            <Link
              href="/shops"
              className="text-xs font-bold text-[#16A34A] hover:underline flex items-center gap-1"
            >
              <Store size={13} />
              <span>Browse all stalls</span>
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-center mb-3">
                <CategoryIcon slug={category.slug} size={64} />
              </div>
              <p className="font-bold text-sm text-gray-800">
                Fresh stalls are restocking {category.name.toLowerCase()}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Mama mboga sellers in your area update their fresh stock every morning by 6:30 AM.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link
                  href="/home"
                  className="px-4 py-2 rounded-xl bg-[#073729] text-white text-xs font-bold"
                >
                  Browse today&apos;s fresh harvest
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
