// Calls OpenStreetMap's Nominatim API directly from the client — no backend
// needed for this. (Browsers can't set a custom User-Agent header anyway, so
// proxying through our own API route bought nothing here; Nominatim's usage
// policy is satisfied by the page's own Referer header, which the browser
// sends automatically.)

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  village?: string;
  city?: string;
  county?: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error("Unable to resolve that location.");

  const data = await response.json() as { address?: NominatimAddress; display_name?: string };
  const addr = data.address ?? {};
  const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || "";
  const city = addr.city || addr.town || addr.county || "";
  const label = [neighborhood, city].filter(Boolean).join(", ") || data.display_name || null;

  if (!label) throw new Error("Unable to resolve that location.");
  return label;
}

export async function forwardGeocode(query: string): Promise<{ lat: number; lng: number }> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error("Unable to resolve that address.");

  const data = await response.json() as { lat: string; lon: string }[];
  const first = data[0];
  if (!first) throw new Error("Address not found.");
  return { lat: Number(first.lat), lng: Number(first.lon) };
}
