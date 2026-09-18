
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "@/lib/hooks/useCookieConsent";

export default function CookieConsentBanner() {
  const { consent, ready, accept, decline } = useCookieConsent();
  const visible = ready && consent === "unset";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#16A34A]">
                <Cookie size={17} />
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                We use essential cookies to keep you signed in, and optional local caching (like remembering your delivery location) to make MamaFresh faster. Signing in always needs the essential cookies — the caching part is up to you.
              </p>
            </div>
            <div className="flex shrink-0 gap-2 sm:ml-2">
              <button onClick={decline} className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 sm:flex-none">
                Decline
              </button>
              <button onClick={accept} className="flex-1 rounded-full bg-[#073729] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B3D2E] sm:flex-none">
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
