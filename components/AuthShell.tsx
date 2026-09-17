"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#edf1ee] px-4 py-6 sm:px-8 sm:py-10 lg:flex lg:items-center lg:justify-center">
      <div className="relative grid min-h-[650px] w-full max-w-5xl overflow-hidden bg-white shadow-[0_24px_70px_rgba(27,48,39,0.16)] lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-[#a8c9bc] lg:block">
          <Image src="/offer.png" alt="Fresh produce" fill priority className="object-cover object-right opacity-70 mix-blend-multiply" sizes="50vw" />
          <div className="absolute inset-0 bg-[#a8c9bc]/75" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-[#23443a]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#386b59]">MamaFresh customer portal</span>
            <div className="max-w-xs">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#386b59]">Fresh from your neighborhood</p>
              <h2 className="text-4xl font-black leading-[1.05]">Good food starts close to home.</h2>
              <p className="mt-5 text-sm leading-6 text-[#386052]">Shop fresh produce from trusted local sellers and have it delivered to your door.</p>
              <div className="mt-8 flex gap-2" aria-hidden="true">
                <span className="h-1.5 w-9 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              </div>
            </div>
            <p className="text-xs font-medium text-[#386052]">Fresh choices. Local hands. Happier tables.</p>
          </div>
        </section>

        <section className="relative flex flex-col justify-center px-7 py-10 sm:px-14 lg:px-16">
          <Link href="/home" aria-label="Back to home" className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#073729] lg:hidden">
            <ArrowLeft size={18} />
          </Link>
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 text-center">
              <h1 className="text-xl font-semibold text-[#747474]">{title}</h1>
              <p className="mt-2 text-xs text-[#999]">{description}</p>
            </div>
            {children}
            <div className="mt-8 text-center">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
