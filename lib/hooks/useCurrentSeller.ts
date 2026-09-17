"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SellerRow } from "@/lib/supabase/types";

interface CurrentSellerState {
  seller: SellerRow | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentSeller(): CurrentSellerState {
  const [state, setState] = useState<CurrentSellerState>({ seller: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (active) setState({ seller: null, loading: false, error: null });
          return;
        }
        // A "draft" row means onboarding was started but never submitted — the
        // dashboard should treat that the same as "no shop yet" and send the
        // seller back to /seller/register, which resumes the draft.
        const { data, error } = await supabase.from("sellers").select("*").eq("owner_id", user.id).neq("status", "draft").maybeSingle();
        if (error) throw error;
        if (active) setState({ seller: data as SellerRow | null, loading: false, error: null });
      } catch (err) {
        if (active) setState({ seller: null, loading: false, error: err instanceof Error ? err.message : "Unable to load your shop." });
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return state;
}
