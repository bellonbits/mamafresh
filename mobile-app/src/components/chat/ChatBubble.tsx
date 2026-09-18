
import Image from "@/lib/next-compat/image";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import type { ChatMessageRow } from "@/lib/supabase/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBubble({ message, isMine }: { message: ChatMessageRow; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs",
          isMine ? "rounded-br-md bg-[#DCFCE7] text-[#073729]" : "rounded-bl-md border border-gray-100 bg-white text-gray-800"
        )}
      >
        {message.product_id && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-black/5 bg-white/70 p-2">
            {message.product_image && (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                <Image src={message.product_image} alt={message.product_name ?? ""} fill className="object-cover" sizes="36px" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold">{message.product_name}</p>
              {message.product_price != null && <p className="text-[10px] text-gray-500">{formatKSh(message.product_price)}</p>}
            </div>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <div className={cn("mt-1 flex items-center gap-1", isMine ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
          {isMine && (
            message.status === "read" ? (
              <CheckCheck size={13} className="text-[#2563EB]" />
            ) : message.status === "delivered" ? (
              <CheckCheck size={13} className="text-gray-400" />
            ) : (
              <Check size={13} className="text-gray-400" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
