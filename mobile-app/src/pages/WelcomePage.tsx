
import { useRef, useState } from "react";
import Image from "@/lib/next-compat/image";
import { useRouter } from "@/lib/next-compat/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_SEEN_KEY } from "@/lib/onboarding";

const SLIDES = [
  {
    image: "/images/marketing/market-stall.jpg",
    title: "Fresh from your neighborhood mama mboga.",
    copy: "Real sellers, real prices — fresh vegetables and fruit sourced daily from stalls near you.",
  },
  {
    image: "/images/marketing/produce-basket.jpg",
    title: "Build your basket in minutes.",
    copy: "Search, browse by category, or just ask MamaFresh AI to put together exactly what you need.",
  },
  {
    image: "/images/marketing/delivery.jpg",
    title: "Track your delivery live.",
    copy: "Watch your mama mboga make their way to you on a live map, with a real arrival estimate.",
  },
];

function finishOnboarding(router: ReturnType<typeof useRouter>) {
  try { window.localStorage.setItem(ONBOARDING_SEEN_KEY, "true"); } catch { /* private mode, etc. */ }
  router.replace("/home");
}

export default function WelcomePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) goTo(index + 1);
    else if (delta > 40) goTo(index - 1);
    touchStartX.current = null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF7]">
      <div
        className="relative flex-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image src={slide.image} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF7] via-[#FFFDF7]/10 to-black/10" />

        <button
          onClick={() => finishOnboarding(router)}
          className="absolute right-5 text-xs font-bold text-white drop-shadow"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
        >
          Skip
        </button>
      </div>

      <div className="px-6 pb-8 pt-7" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-[#073729]">{slide.title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-gray-500">{slide.copy}</p>

        <div className="mt-6 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-[#073729]" : "w-1.5 bg-gray-200")}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          {!isLast && (
            <button
              onClick={() => finishOnboarding(router)}
              className="flex-1 rounded-full border border-gray-200 py-3.5 text-xs font-black text-gray-600"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => (isLast ? finishOnboarding(router) : goTo(index + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#073729] py-3.5 text-xs font-black text-white active:scale-98"
          >
            {isLast ? "Get Started" : "Next"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
