
import Image from "@/lib/next-compat/image";
import { Leaf, Heart, Store, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Leaf, label: "Fresh Produce" },
  { icon: Heart, label: "Better Nutrition" },
  { icon: Store, label: "Local Sellers" },
  { icon: Users, label: "Stronger Communities" },
];

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#FFFDF7]">
      <Leaf size={64} className="pointer-events-none absolute -left-4 -top-2 -rotate-12 text-[#84CC16]/20" />
      <Leaf size={72} className="pointer-events-none absolute -right-6 top-8 rotate-45 text-[#84CC16]/20" />
      <Leaf size={56} className="pointer-events-none absolute -left-6 bottom-40 rotate-12 text-[#84CC16]/15" />
      <Leaf size={64} className="pointer-events-none absolute -right-4 bottom-48 -rotate-45 text-[#84CC16]/15" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 pb-6" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="relative w-full max-w-[280px]">
          <Image src="/images/splash-hero.png" alt="" width={280} height={336} priority className="h-auto w-full object-contain" sizes="280px" />
          <p className="absolute -right-2 top-0 rotate-3 text-right font-serif text-sm italic leading-tight text-[#16A34A]">
            Fresh Food
            <br />
            Better Lives
          </p>
        </div>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          <span className="text-[#073729]">Mama</span>
          <span className="text-[#16A34A]">Fresh</span>
        </h1>
        <p className="mt-2 text-center text-xs font-semibold text-gray-500">
          Fresh groceries <span className="mx-1 text-[#84CC16]">•</span> Healthy families <span className="mx-1 text-[#84CC16]">•</span> Stronger communities
        </p>

        <div className="mt-6 flex items-start justify-center gap-1">
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <div key={label} className={cn(i > 0 && "border-l border-gray-200 pl-1")}>
              <div className="flex w-16 flex-col items-center gap-1.5 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4D2] text-[#16A34A]">
                  <Icon size={18} />
                </span>
                <span className="text-[9px] font-bold leading-tight text-[#073729]">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative flex items-center justify-center gap-2 bg-[#073729] py-6 text-white"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <svg className="absolute -top-8 left-0 h-8 w-full text-[#073729]" viewBox="0 0 400 32" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,32 C100,0 300,0 400,32 L400,32 L0,32 Z" fill="currentColor" />
        </svg>
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs font-bold">Loading...</span>
      </div>
    </div>
  );
}
