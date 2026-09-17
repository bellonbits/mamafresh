import {
  Salad,
  Apple,
  Coffee,
  Beef,
  Wheat,
  Milk,
  Carrot,
  Sparkles,
  Flame,
  ShoppingBag,
  Droplet,
  Cookie,
  Utensils,
  CupSoda,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  slug: string;
  className?: string;
  size?: number;
  noFrame?: boolean;
}

// Fallback Lucide icons
const ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  all: { icon: Sparkles, color: "text-[#16A34A]" },
  vegetables: { icon: Salad, color: "text-emerald-700" },
  fruits: { icon: Apple, color: "text-rose-600" },
  "roots-tubers": { icon: Carrot, color: "text-amber-700" },
  "cereals-grains": { icon: Wheat, color: "text-amber-600" },
  "beans-pulses": { icon: Utensils, color: "text-emerald-800" },
  "dairy-eggs": { icon: Milk, color: "text-blue-600" },
  "meat-poultry": { icon: Beef, color: "text-red-700" },
  "cooking-oils": { icon: Droplet, color: "text-yellow-600" },
  "spices-ingredients": { icon: Flame, color: "text-orange-600" },
  "bread-bakery": { icon: Wheat, color: "text-amber-700" },
  "sugar-salt": { icon: Sparkles, color: "text-pink-600" },
  breakfast: { icon: Coffee, color: "text-amber-900" },
  snacks: { icon: Cookie, color: "text-purple-600" },
  drinks: { icon: CupSoda, color: "text-indigo-600" },
  meats: { icon: Beef, color: "text-red-700" },
  dairy: { icon: Milk, color: "text-blue-600" },
  breads: { icon: Wheat, color: "text-amber-600" },
  roots: { icon: Carrot, color: "text-amber-700" },
};

// Direct illustrations from /public/catego
const IMAGE_MAP: Record<string, string> = {
  all: "/catego/all.png",
  vegetables: "/catego/vegetables.png",
  fruits: "/catego/fruits.png",
  "roots-tubers": "/catego/potatoes.png",
  roots: "/catego/potatoes.png",
  potatoes: "/catego/potatoes.png",
  "cereals-grains": "/catego/cereal.png",
  cereal: "/catego/cereal.png",
  cereals: "/catego/cereal.png",
  "beans-pulses": "/catego/beans.png",
  beans: "/catego/beans.png",
  "dairy-eggs": "/catego/milk.png",
  dairy: "/catego/milk.png",
  milk: "/catego/milk.png",
  "meat-poultry": "/catego/meat.png",
  meats: "/catego/meat.png",
  meat: "/catego/meat.png",
  "cooking-oils": "/catego/cooking_oil.png",
  "cooking-oil": "/catego/cooking_oil.png",
  oil: "/catego/cooking_oil.png",
  "spices-ingredients": "/catego/spice.png",
  spice: "/catego/spice.png",
  spices: "/catego/spice.png",
  "bread-bakery": "/catego/bread.png",
  breads: "/catego/bread.png",
  bread: "/catego/bread.png",
  "sugar-salt": "/catego/sugar.png",
  sugar: "/catego/sugar.png",
  breakfast: "/catego/coffee.png",
  coffee: "/catego/coffee.png",
  drinks: "/catego/drinks.png",
  snacks: "/catego/snacks.png",
};

export default function CategoryIcon({
  slug,
  className,
  size = 64,
  noFrame = false,
}: CategoryIconProps) {
  const image = IMAGE_MAP[slug];
  const item = ICON_MAP[slug] || {
    icon: ShoppingBag,
    color: "text-emerald-700",
  };
  const Icon = item.icon;

  const innerIcon = image ? (
    <div
      className="relative flex items-center justify-center transition-transform"
      style={{ width: size, height: size }}
    >
      <Image
        src={image}
        alt={slug}
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105"
        priority
      />
    </div>
  ) : (
    <Icon size={Math.round(size * 0.7)} className={item.color} strokeWidth={2.2} />
  );

  if (noFrame) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        {innerIcon}
      </div>
    );
  }

  // Generous, soft rounded frame container
  const frameSize = size + 14;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 rounded-2xl bg-[#F6FAF6] border border-emerald-100/80 shadow-2xs transition-all duration-200 group-hover:bg-white group-hover:shadow-md group-hover:border-emerald-300",
        className
      )}
      style={{ width: frameSize, height: frameSize }}
    >
      <div
        className="relative z-10 flex items-center justify-center p-1"
        style={{ width: size, height: size }}
      >
        {innerIcon}
      </div>
    </div>
  );
}
