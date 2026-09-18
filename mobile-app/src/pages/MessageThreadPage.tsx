
import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams, useParams } from "@/lib/next-compat/navigation";
import CustomerMessagesShell from "@/components/chat/CustomerMessagesShell";
import MessagesBackground from "@/components/chat/MessagesBackground";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CustomerChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) { router.replace(`/login?next=/messages/${threadId}`); return; }
      setUserId(user.id);
      setReady(true);
    });
    return () => { active = false; };
  }, [threadId, router]);

  if (!ready || !userId) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName");
  const productImage = searchParams.get("productImage");
  const productPrice = searchParams.get("productPrice");
  const initialProduct = productId && productName
    ? { id: productId, name: productName, image: productImage ?? "", price: Number(productPrice) || 0 }
    : undefined;

  return (
    <MessagesBackground>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white/80 px-4 py-3.5 backdrop-blur-sm">
        <Link href="/messages" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><ChevronLeft size={20} /></Link>
        <h1 className="text-base font-black text-[#073729]">Messages</h1>
      </header>
      <CustomerMessagesShell
        myUserId={userId}
        selectedThreadId={threadId}
        initialProduct={initialProduct}
        initialMessage={initialProduct ? `Hi! I'd like to confirm some details about ${initialProduct.name}.` : undefined}
      />
    </MessagesBackground>
  );
}
