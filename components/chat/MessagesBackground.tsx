"use client";

export default function MessagesBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F4FBF6] via-[#F4F7F4] to-[#FFFDF7]">
      {/* Decorative glow — soft, blurred, brand-colored, never competes with the chat card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#84CC16]/25 blur-[100px]" />
        <div className="absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-[#16A34A]/15 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-[#F6D43A]/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(#073729 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
