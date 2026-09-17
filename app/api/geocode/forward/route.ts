import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q is required." }, { status: 400 });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "MamaFresh/1.0 (contact: support@mamafresh.app)", Accept: "application/json" } }
    );
    if (!response.ok) return NextResponse.json({ error: "Unable to resolve that address." }, { status: 502 });

    const data = await response.json() as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return NextResponse.json({ error: "Address not found." }, { status: 404 });

    return NextResponse.json({ lat: Number(first.lat), lng: Number(first.lon) });
  } catch {
    return NextResponse.json({ error: "Unable to reach the location service." }, { status: 502 });
  }
}
