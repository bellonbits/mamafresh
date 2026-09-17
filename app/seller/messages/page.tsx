"use client";

import { useEffect, useState } from "react";
import SellerMessagesShell from "@/components/chat/SellerMessagesShell";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SellerMessagesPage() {
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (active) setUserId(user?.id ?? null);
    });
    return () => { active = false; };
  }, []);

  if (sellerLoading || !seller || !userId) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  return <SellerMessagesShell seller={seller} myUserId={userId} />;
}
