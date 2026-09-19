
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_TEXT = "Free delivery on orders over KSh 1,500. Freshness delivered to your door.";

export function useDeliveryBanner() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("marketplace_settings")
      .select("delivery_banner_text, delivery_banner_enabled")
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setText(data.delivery_banner_text);
        setEnabled(data.delivery_banner_enabled);
      });
    return () => { active = false; };
  }, []);

  return { text, enabled };
}
