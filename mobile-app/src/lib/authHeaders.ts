import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * The backend API routes (orders, assistant, avatar-sign) run on a different
 * origin than this app and can't rely on cookies for auth, so every call to
 * them carries the current Supabase session's access token instead.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}
