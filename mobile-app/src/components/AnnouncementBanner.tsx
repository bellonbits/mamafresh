
import { useEffect, useState } from "react";
import { usePathname } from "@/lib/next-compat/navigation";
import { Megaphone, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnnouncementRow } from "@/lib/supabase/types";

const DISMISSED_KEY = "mamafresh-dismissed-announcement";

export default function AnnouncementBanner() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const row = data as AnnouncementRow;
        let dismissedId: string | null = null;
        try { dismissedId = window.localStorage.getItem(DISMISSED_KEY); } catch { /* private mode, etc. */ }
        setAnnouncement(row);
        queueMicrotask(() => setDismissed(dismissedId === row.id));
      });
    return () => { active = false; };
  }, []);

  const dismiss = () => {
    if (!announcement) return;
    setDismissed(true);
    try { window.localStorage.setItem(DISMISSED_KEY, announcement.id); } catch { /* private mode, etc. */ }
  };

  const hidden = pathname.startsWith("/seller") || pathname.startsWith("/admin") || pathname === "/assistant" || pathname.startsWith("/messages") || pathname === "/welcome";
  if (!announcement || dismissed || hidden) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-[#B8EF4A] px-4 py-2 text-center text-[11px] font-bold text-[#073729]">
      <Megaphone size={13} className="shrink-0" />
      <span className="truncate">{announcement.title}{announcement.body ? ` — ${announcement.body}` : ""}</span>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full p-0.5 hover:bg-black/10"><X size={13} /></button>
    </div>
  );
}
