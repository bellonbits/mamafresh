
import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { ChevronLeft } from "lucide-react";
import CustomerMessagesShell from "@/components/chat/CustomerMessagesShell";
import MessagesBackground from "@/components/chat/MessagesBackground";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (active) { setUserId(user?.id ?? null); setAuthChecked(true); }
    });
    return () => { active = false; };
  }, []);

  if (authChecked && !userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F4F7F4] p-6 text-center">
        <p className="text-lg font-black text-gray-800">Sign in to see your messages</p>
        <Link href="/login?next=/messages" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Sign in</Link>
      </div>
    );
  }

  return (
    <MessagesBackground>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white/80 px-4 py-3.5 backdrop-blur-sm">
        <Link href="/home" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><ChevronLeft size={20} /></Link>
        <h1 className="text-base font-black text-[#073729]">Messages</h1>
      </header>
      {userId ? <CustomerMessagesShell myUserId={userId} /> : (
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-bold text-gray-400">Loading...</div>
      )}
    </MessagesBackground>
  );
}
