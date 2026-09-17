"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminRole } from "@/lib/supabase/types";

interface AdminState {
  isAdmin: boolean;
  adminRole: AdminRole | null;
  signedIn: boolean;
  loading: boolean;
}

export function useIsAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ isAdmin: false, adminRole: null, signedIn: false, loading: true });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setState({ isAdmin: false, adminRole: null, signedIn: false, loading: false });
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role, admin_role").eq("id", user.id).maybeSingle();
      if (active) setState({ isAdmin: profile?.role === "admin", adminRole: (profile?.admin_role as AdminRole | null) ?? null, signedIn: true, loading: false });
    };
    void load();
    return () => { active = false; };
  }, []);

  return state;
}
