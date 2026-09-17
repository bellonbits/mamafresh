"use client";

import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col animate-fade-in">
      {/* Header */}
      <header className="bg-[#073729] px-4 pt-4 pb-6 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold">Select Location</h1>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-extrabold tracking-tight">
            Where should we look for your groceries?
          </h2>
          <p className="text-xs text-emerald-200/80 mt-1">
            We show fresh produce & mama mbogas closest to your neighborhood for fast 30-minute delivery.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-5 max-w-md mx-auto w-full md:max-w-2xl lg:max-w-4xl">
        {/* GPS Button */}
        <button
          onClick={() => void handleUseGps()}
          disabled={locating}
          className="w-full bg-[#EAF7EE] hover:bg-[#DCF2E2] border border-[#B6E2BA] rounded-2xl p-4 flex items-center justify-between text-left shadow-xs transition-all active:scale-98 mb-2 group disabled:opacity-70"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Navigation size={18} className={locating ? "animate-spin" : ""} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#073729]">
                {locating ? "Locating your device..." : "Use my current location"}
              </p>
              <p className="text-xs text-[#15803d]">Real GPS via your browser</p>
            </div>
          </div>
          <Sparkles size={16} className="text-[#16A34A]" />
        </button>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Neighborhood List */}
        <div className="space-y-2 mt-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
            Or choose a neighborhood
          </p>

        </div>
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
