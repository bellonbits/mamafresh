"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ServiceAreaRow } from "@/lib/supabase/types";

export function useServiceAreas() {
  const [areas, setAreas] = useState<ServiceAreaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("service_areas")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setAreas((data ?? []) as ServiceAreaRow[]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const labels = areas.map((a) => `${a.name}, ${a.city}`);

  return { areas, labels, loading };
}
