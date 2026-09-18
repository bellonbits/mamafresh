import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseApiClient, withCors } from "@/lib/supabase/server";

function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init)) as NextResponse;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  const { supabase, getUser } = await createSupabaseApiClient(request);
  if (!supabase) return json({ error: "Supabase is not configured." }, { status: 503 });

  const user = await getUser();
  if (!user) return json({ error: "Sign in required." }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: "Image uploads are not configured yet." }, { status: 503 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `mamafresh/avatars/${user.id}`;
  const publicId = "avatar";
  // Fixed public_id + overwrite so re-uploading replaces the old photo instead of piling up copies.
  const paramsToSign = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  return json({ cloudName, apiKey, timestamp, folder, publicId, overwrite: true, signature });
}
