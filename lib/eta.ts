// Straight-line distance + a rough delivery ETA. There's no routing API in this
// app (no key/budget for one), so this is an honest estimate — haversine
// distance over an assumed average delivery speed — not a road-routed ETA.

const EARTH_RADIUS_KM = 6371;
const ASSUMED_DELIVERY_SPEED_KMH = 20; // boda-boda pace through neighborhood streets, incl. stops

export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineDistanceKm(from: LatLng, to: LatLng): number {
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface EtaEstimate {
  distanceKm: number;
  minutes: number;
  arrivalTime: Date;
}

export function estimateEta(from: LatLng, to: LatLng): EtaEstimate {
  const distanceKm = haversineDistanceKm(from, to);
  const minutes = Math.max(2, Math.round((distanceKm / ASSUMED_DELIVERY_SPEED_KMH) * 60));
  const arrivalTime = new Date(Date.now() + minutes * 60000);
  return { distanceKm, minutes, arrivalTime };
}
