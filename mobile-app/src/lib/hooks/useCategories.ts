"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CategoryRow } from "@/lib/supabase/types";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("categories")
      .select("*")
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setCategories((data ?? []) as CategoryRow[]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  return { categories, loading };
}
