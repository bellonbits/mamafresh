import { NextResponse } from "next/server";
import { withCors } from "@/lib/supabase/server";

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  village?: string;
  city?: string;
  county?: string;
  state?: string;
  road?: string;
  house_number?: string;
  country?: string;
}

function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init)) as NextResponse;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!lat || !lon) return json({ error: "lat and lon are required." }, { status: 400 });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=14&addressdetails=1`,
      { headers: { "User-Agent": "MamaFresh/1.0 (contact: support@mamafresh.app)", Accept: "application/json" } }
    );
    if (!response.ok) return json({ error: "Unable to resolve that location." }, { status: 502 });

    const data = await response.json() as { address?: NominatimAddress; display_name?: string };
    const addr = data.address ?? {};
    const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || "";
    const city = addr.city || addr.town || addr.county || "";
    const label = [neighborhood, city].filter(Boolean).join(", ") || data.display_name || null;

    if (!label) return json({ error: "Unable to resolve that location." }, { status: 502 });
    return json({
      label,
      // Structured pieces for forms that fill several fields at once (e.g. seller registration).
      area: addr.suburb || addr.neighbourhood || addr.town || addr.village || "",
      subCounty: addr.city_district || addr.suburb || "",
      county: addr.county || addr.state || addr.city || "",
      street: [addr.house_number, addr.road].filter(Boolean).join(" ") || "",
      country: addr.country || "",
    });
  } catch {
    return json({ error: "Unable to reach the location service." }, { status: 502 });
  }
}
