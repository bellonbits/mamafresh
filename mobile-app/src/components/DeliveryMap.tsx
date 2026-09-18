
import { useEffect, useRef, useState } from "react";
import type LType from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/eta";

interface Props {
  destination: LatLng;
  sellerPosition: LatLng | null;
  sellerName: string;
  className?: string;
}

export default function DeliveryMap({ destination, sellerPosition, sellerName, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const sellerMarkerRef = useRef<LType.Marker | null>(null);
  const lineRef = useRef<LType.Polyline | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize the map once per destination (destination essentially never changes mid-order).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { default: L } = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);

      const destIcon = L.divIcon({
        html: '<div style="width:16px;height:16px;border-radius:9999px;background:#073729;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map).bindTooltip("Delivery address", { direction: "top" });
      map.setView([destination.lat, destination.lng], 14);

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      sellerMarkerRef.current = null;
      lineRef.current = null;
      setReady(false);
    };
  }, [destination.lat, destination.lng]);

  // Keep the rider marker + route line in sync as the seller's live position updates.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !sellerPosition) return;

    const riderLatLng = L.latLng(sellerPosition.lat, sellerPosition.lng);
    if (sellerMarkerRef.current) {
      sellerMarkerRef.current.setLatLng(riderLatLng);
    } else {
      const riderIcon = L.icon({ iconUrl: "/delivery.png", iconSize: [46, 46], iconAnchor: [23, 23] });
      sellerMarkerRef.current = L.marker(riderLatLng, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip(sellerName, { direction: "top" });
    }

    const destLatLng = L.latLng(destination.lat, destination.lng);
    if (lineRef.current) {
      lineRef.current.setLatLngs([riderLatLng, destLatLng]);
    } else {
      lineRef.current = L.polyline([riderLatLng, destLatLng], { color: "#16A34A", weight: 3, dashArray: "6 8" }).addTo(map);
    }

    map.fitBounds(L.latLngBounds([riderLatLng, destLatLng]), { padding: [48, 48], maxZoom: 16 });
    // Depend on lat/lng values, not the sellerPosition object reference — a new object every
    // poll would otherwise re-run this on every parent render instead of on real movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sellerPosition?.lat, sellerPosition?.lng, destination.lat, destination.lng, sellerName]);

  return <div ref={containerRef} className={className ?? "h-64 w-full"} />;
}
