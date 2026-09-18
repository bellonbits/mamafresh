
import Image from "@/lib/next-compat/image";

interface Props {
  name: string;
  avatarUrl?: string;
  size?: number;
  online?: boolean;
}

export default function ChatAvatar({ name, avatarUrl, size = 40, online }: Props) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#DCFCE7] font-black text-[#15803d]"
        style={{ fontSize: Math.max(10, Math.round(size * 0.4)) }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} fill className="object-cover" sizes={`${size}px`} />
        ) : (
          (name || "?").slice(0, 1).toUpperCase()
        )}
      </div>
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22C55E]" />}
    </div>
  );
}
