"use client";

import { useState } from "react";
import { Navigation, AlertTriangle } from "lucide-react";
import { TextField, TextAreaField, SelectField } from "@/components/seller-onboarding/FormField";
import { SELLER_AREAS, COUNTIES } from "@/components/seller-onboarding/constants";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  updateForm: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: FieldErrors;
}

interface ReverseGeocodeResult {
  area?: string;
  subCounty?: string;
  county?: string;
  street?: string;
  error?: string;
}

function matchOption(detected: string, options: { value: string }[]): string | null {
  const needle = detected.trim().toLowerCase();
  if (!needle) return null;
  const match = options.find((o) => o.value !== "__other__" && (needle === o.value.toLowerCase() || needle.includes(o.value.toLowerCase()) || o.value.toLowerCase().includes(needle)));
  return match?.value ?? null;
}

export default function StepLocation({ form, updateForm, errors }: Props) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setLocateError(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocateError("Your device doesn't support location detection.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json() as Promise<ReverseGeocodeResult>)
          .then((result) => {
            if (result.error) {
              setLocateError(result.error);
              return;
            }
            if (result.area) {
              const matched = matchOption(result.area, SELLER_AREAS);
              if (matched) {
                updateForm("area", matched);
              } else {
                updateForm("area", "__other__");
                updateForm("areaOther", result.area);
              }
            }
            if (result.county) {
              updateForm("county", matchOption(result.county, COUNTIES) ?? "Other");
            }
            if (result.subCounty) updateForm("subCounty", result.subCounty);
            if (result.street) updateForm("street", result.street);
          })
          .catch(() => setLocateError("Unable to determine your address. Fill in the fields manually."))
          .finally(() => setLocating(false));
      },
      (err) => {
        setLocating(false);
        setLocateError(err.code === err.PERMISSION_DENIED ? "Location access was denied. Enable it in your browser's site settings and try again." : "Unable to get your location right now.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="flex items-center gap-2 rounded-full border border-[#16A34A]/30 bg-[#EAF7EE] px-4 py-2.5 text-xs font-bold text-[#16A34A] transition-colors hover:bg-[#DCF2E2] disabled:opacity-60"
      >
        <Navigation size={14} className={locating ? "animate-spin" : ""} />
        {locating ? "Detecting your location..." : "Use my current location"}
      </button>
      {locateError && (
        <p className="flex items-start gap-1.5 rounded-lg bg-red-50 p-2.5 text-[11px] font-semibold text-red-700">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />{locateError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Area / Estate" required value={form.area} onChange={(v) => updateForm("area", v)} options={SELLER_AREAS} error={errors.area} />
        {form.area === "__other__" && (
          <TextField label="Your Area" required value={form.areaOther} onChange={(v) => updateForm("areaOther", v)} placeholder="e.g. Ruaraka" error={errors.areaOther} />
        )}
        <SelectField label="County" required value={form.county} onChange={(v) => updateForm("county", v)} options={COUNTIES} error={errors.county} />
        <TextField label="Sub-county" value={form.subCounty} onChange={(v) => updateForm("subCounty", v)} placeholder="e.g. Kasarani" />
        <TextField label="Street / Building" value={form.street} onChange={(v) => updateForm("street", v)} placeholder="e.g. Seasons Stage, Stall 14" />
        <TextField label="Landmark" value={form.landmark} onChange={(v) => updateForm("landmark", v)} placeholder="Near Kasarani Mall" />
        <TextAreaField label="Location description" value={form.locationNotes} onChange={(v) => updateForm("locationNotes", v)} placeholder="Any extra directions for riders or customers." className="sm:col-span-2" rows={2} />
      </div>
    </div>
  );
}
