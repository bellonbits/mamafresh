import { useCallback, useEffect, useState } from "react";
import { getStoredCookieConsent } from "@/lib/hooks/useCookieConsent";
import { reverseGeocode } from "@/lib/geocode";

const LOCATION_CACHE_KEY = "mamafresh-location";
export const DEFAULT_LOCATION = "Kasarani, Nairobi";

function readCachedLocation(): string | null {
  if (getStoredCookieConsent() !== "accepted") return null;
  try { return window.localStorage.getItem(LOCATION_CACHE_KEY); } catch { return null; }
}

function writeCachedLocation(value: string) {
  if (getStoredCookieConsent() !== "accepted") return;
  try { window.localStorage.setItem(LOCATION_CACHE_KEY, value); } catch { /* private mode, etc. */ }
}

function isGeolocationPositionError(err: unknown): err is GeolocationPositionError {
  return typeof err === "object" && err !== null && "code" in err && "message" in err;
}

/** Shared delivery-location state — cached across visits (if the visitor accepted optional caching) and usable anywhere a location picker is needed. */
export function useDeliveryLocation() {
  const [location, setLocationState] = useState(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCachedLocation();
    if (cached) queueMicrotask(() => setLocationState(cached));
  }, []);

  const setLocation = useCallback((value: string) => {
    setLocationState(value);
    writeCachedLocation(value);
  }, []);

  const detectCurrentLocation = useCallback(async (): Promise<string | null> => {
    setError(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Your device doesn't support location detection.");
      return null;
    }
    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      });
      const { latitude, longitude } = position.coords;
      const label = await reverseGeocode(latitude, longitude);
      setLocation(label);
      return label;
    } catch (err) {
      const message = isGeolocationPositionError(err)
        ? err.code === err.PERMISSION_DENIED
          ? "Location access was denied. Enable it in your browser's site settings and try again."
          : "Unable to get your location right now. Try again."
        : err instanceof Error ? err.message : "Unable to get your location.";
      setError(message);
      return null;
    } finally {
      setLocating(false);
    }
  }, [setLocation]);

  return { location, setLocation, locating, error, detectCurrentLocation };
}
