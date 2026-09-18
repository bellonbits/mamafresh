import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot always write cookies; proxy refreshes them.
        }
      },
    },
  });
}

/**
 * For API routes callable from a different origin (the Capacitor mobile app),
 * where cookies aren't sent. Prefers an `Authorization: Bearer <access_token>`
 * header — the mobile app's Supabase session token — over cookies, so RLS-scoped
 * queries run as that authenticated user either way. Falls back to the cookie
 * session for same-origin calls from the web app, unchanged.
 */
export async function createSupabaseApiClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { supabase: null, getUser: async () => null };

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false },
    });
    return { supabase, getUser: async () => (await supabase.auth.getUser(bearer)).data.user };
  }

  const supabase = await createSupabaseServerClient();
  return { supabase, getUser: async () => (await supabase!.auth.getUser()).data.user };
}

/** Standard CORS headers so the Capacitor mobile app (a different origin) can call these routes. */
export function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
