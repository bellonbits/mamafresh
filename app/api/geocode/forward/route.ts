import { NextResponse } from "next/server";
import { withCors } from "@/lib/supabase/server";

function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init)) as NextResponse;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return json({ error: "q is required." }, { status: 400 });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "MamaFresh/1.0 (contact: support@mamafresh.app)", Accept: "application/json" } }
    );
    if (!response.ok) return json({ error: "Unable to resolve that address." }, { status: 502 });

    const data = await response.json() as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return json({ error: "Address not found." }, { status: 404 });

    return json({ lat: Number(first.lat), lng: Number(first.lon) });
  } catch {
    return json({ error: "Unable to reach the location service." }, { status: 502 });
  }
}
