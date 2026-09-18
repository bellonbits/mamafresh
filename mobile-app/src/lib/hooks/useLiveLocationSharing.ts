"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const WRITE_THROTTLE_MS = 8000;

export function useLiveLocationSharing(orderId: string) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastWriteRef = useRef(0);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }, []);

  const start = useCallback(() => {
    setError(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Your device doesn't support location sharing.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastWriteRef.current < WRITE_THROTTLE_MS) return;
        lastWriteRef.current = now;
        void getSupabaseBrowserClient()
          .from("orders")
          .update({
            seller_lat: position.coords.latitude,
            seller_lng: position.coords.longitude,
            seller_location_updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      },
      () => setError("Unable to get your location. Check location permissions."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    watchIdRef.current = id;
    setSharing(true);
  }, [orderId]);

  // Stop tracking (and release the device's GPS) if the component unmounts while still sharing.
  useEffect(() => stop, [stop]);

  return { sharing, error, start, stop };
}
