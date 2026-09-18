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

  // Any row (including a draft in progress) proves this user is registering
  // or running a shop — that's enough to let them upload photos for it.
  const { data: seller } = await supabase.from("sellers").select("id").eq("owner_id", user.id).maybeSingle();
  if (!seller) return json({ error: "Start your seller registration before uploading product photos." }, { status: 403 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: "Image uploads are not configured yet." }, { status: 503 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `mamafresh/products/${seller.id}`;
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  return json({ cloudName, apiKey, timestamp, folder, signature });
}
