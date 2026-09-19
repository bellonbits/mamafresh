
import { useRouter } from "@/lib/next-compat/navigation";
import { ChevronLeft, Navigation, MapPin, Check, Sparkles, AlertCircle } from "lucide-react";
import { useDeliveryLocation } from "@/lib/hooks/useDeliveryLocation";
import { useServiceAreas } from "@/lib/hooks/useServiceAreas";
import { cn } from "@/lib/utils";

export default function LocationPage() {
  const router = useRouter();
  const { location, setLocation, locating, error, detectCurrentLocation } = useDeliveryLocation();
  const { labels: areaLabels, loading: areasLoading } = useServiceAreas();

  const handleUseGps = async () => {
    const result = await detectCurrentLocation();
    if (result) router.push("/home");
  };

  const handleSelect = (loc: string) => {
    setLocation(loc);
    setTimeout(() => {
      router.push("/home");
    }, 200);
  };

  return (
    <div className="bg-[#F8FAF9] flex flex-col animate-fade-in">
      {/* Header + GPS button — sticky, stays visible while the list below scrolls */}
      <header className="sticky top-0 z-10 bg-[#073729] px-4 pt-3 pb-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-8 h-8 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-sm font-bold">Select Location</h1>
        </div>

        {/* GPS Button — part of the sticky header so it never scrolls out of reach */}
        <div className="mt-2.5 max-w-md mx-auto w-full md:max-w-2xl lg:max-w-4xl">
          <button
            onClick={() => void handleUseGps()}
            disabled={locating}
            className="w-full bg-white hover:bg-emerald-50 border border-white/20 rounded-full py-2 px-3 flex items-center justify-between text-left shadow-xs transition-all active:scale-98 group disabled:opacity-70"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#16A34A] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Navigation size={15} className={locating ? "animate-spin" : ""} />
              </div>
              <p className="truncate text-xs font-extrabold text-[#073729]">
                {locating ? "Locating your device..." : "Use my current location"}
              </p>
            </div>
            <Sparkles size={14} className="shrink-0 text-[#16A34A]" />
          </button>

          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-semibold text-red-700">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </header>

      {/* Neighborhood List — scrolls normally with the page, under the sticky header */}
      <main className="flex-1 px-4 pb-8 pt-4 max-w-md mx-auto w-full md:max-w-2xl lg:max-w-4xl">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
          Or choose a neighborhood
        </p>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {areasLoading && <p className="col-span-full py-6 text-center text-xs font-bold text-gray-400">Loading service areas...</p>}
          {areaLabels.map((loc) => {
            const isSelected = location === loc;
            return (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={cn(
                  "w-full bg-white rounded-2xl p-3.5 flex items-center justify-between border transition-all text-left shadow-xs active:scale-99",
                  isSelected
                    ? "border-[#16A34A] bg-[#F0FDF4] text-[#073729]"
                    : "border-gray-100 hover:border-gray-200 text-gray-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <MapPin size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{loc}</p>
                    <p className="text-[11px] text-gray-400">Average delivery: 25-35 mins</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
