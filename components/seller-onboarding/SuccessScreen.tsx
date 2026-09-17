"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessScreen({ shopName }: { shopName: string }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e3f5e7] text-[#16A34A]">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-[#073729]">Seller Application Submitted</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">Your MamaFresh shop application has been submitted successfully.</p>

      <div className="mt-6 rounded-xl bg-[#f6f8f7] p-4 text-left text-sm text-gray-700">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Shop</p>
        <p className="mt-0.5 font-bold text-gray-900">{shopName}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-400">Status</p>
        <p className="mt-0.5 font-bold text-amber-600">Pending approval</p>
      </div>

      <p className="mt-4 text-xs text-gray-400">We&apos;ll notify you once your shop is reviewed. You can check progress or keep setting things up from your dashboard.</p>

      <Link href="/seller" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-[#073729] px-6 text-sm font-semibold text-white hover:bg-[#0B3D2E]">
        Go to Seller Dashboard
      </Link>
    </div>
  );
}
