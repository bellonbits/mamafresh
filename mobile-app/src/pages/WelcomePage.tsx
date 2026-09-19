
import { useRef, useState } from "react";
import Image from "@/lib/next-compat/image";
import { useRouter } from "@/lib/next-compat/navigation";
import { cn } from "@/lib/utils";
import { ONBOARDING_SEEN_KEY } from "@/lib/onboarding";

const SLIDES = [
  {
    image: "/onboarding/shop.png",
    title: "Fresh from your neighborhood mama mboga.",
    copy: "Real sellers, real prices — fresh vegetables and fruit sourced daily from stalls near you.",
  },
  {
    image: "/onboarding/shopping.png",
    title: "Build your basket in minutes.",
    copy: "Search, browse by category, or just ask MamaFresh AI to put together exactly what you need.",
  },
  {
    image: "/onboarding/delivery.png",
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
    <div className="flex min-h-screen flex-col bg-[#EAF6EC]">
      <div
        className="relative flex-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={() => finishOnboarding(router)}
          className="absolute right-5 z-10 text-xs font-bold text-[#073729]/70"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
        >
          Skip
        </button>

        <div className="relative flex h-full items-center justify-center px-10 pb-16" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}>
          <Image src={slide.image} alt="" width={320} height={320} priority className="h-auto w-full max-w-xs object-contain" sizes="(max-width: 480px) 80vw, 320px" />
        </div>

        {/* Hill-shaped divider — the white content panel bulges up into the green header area. */}
        <svg
          className="absolute bottom-0 left-0 h-10 w-full text-white sm:h-14"
          viewBox="0 0 400 56"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,56 C100,0 300,0 400,56 L400,56 L0,56 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="bg-white px-6 pb-8 pt-2 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-[#073729]">{slide.title}</h1>
        <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-gray-500">{slide.copy}</p>

        <div className="mt-6 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-[#16A34A]" : "w-1.5 bg-gray-200")}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? finishOnboarding(router) : goTo(index + 1))}
          className="mt-6 w-full rounded-full bg-[#073729] py-3.5 text-xs font-black text-white active:scale-98"
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
