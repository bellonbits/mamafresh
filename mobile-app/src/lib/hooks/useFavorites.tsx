"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  toggle: (productId: string) => void;
  isSignedIn: boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      if (active) {
        setFavoriteIds(new Set((data ?? []).map((row) => row.product_id as string)));
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const toggle = useCallback((productId: string) => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
        void supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
      } else {
        next.add(productId);
        void supabase.from("favorites").insert({ user_id: userId, product_id: productId });
      }
      return next;
    });
  }, [userId]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggle, isSignedIn: !!userId, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
}
