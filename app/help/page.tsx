"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Plus, Minus, MessageCircle, Phone, Mail, Copy, Check } from "lucide-react";

const FAQS = [
  {
    q: "How fast is delivery?",
    a: "Because all orders are fulfilled by your nearest neighborhood mama mboga (within 1–2 km), average delivery takes 20 to 35 minutes.",
  },
  {
    q: "How do I pay?",
    a: "We support instant M-Pesa STK push as well as cash on delivery. No card or bank account needed.",
  },
  {
    q: "What if an item is not fresh or missing?",
    a: "We offer a 100% satisfaction guarantee. Contact your vendor via WhatsApp or reach our support team and we will replace or refund immediately.",
  },
  {
    q: "Can I order from multiple sellers at once?",
    a: "Each order is dedicated to a single mama mboga to ensure accurate packing and direct delivery from one stall.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order is confirmed, you can track it live from the Orders page. You'll also get real-time status updates as your order moves through Pending → Preparing → Out for delivery.",
  },
  {
    q: "How do I change my delivery address?",
    a: "You can update your saved addresses from the Account page under Addresses. For an active order, please call support immediately.",
  },
  {
    q: "Can I cancel my order?",
    a: "You can cancel an order within 2 minutes of placing it. After that, the seller may have already started preparing it. Contact support for assistance.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  function toggle(i: number) {
    setOpen(open === i ? null : i);
  }

  function copyEmail() {
    navigator.clipboard.writeText("support@mamafresh.co.ke");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-shell min-h-screen bg-[#F7F8F6] pb-28 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/account"
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={20} className="text-[#073729]" />
        </Link>
        <h1 className="text-sm font-black text-[#073729]">Help &amp; Support</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-6">
        {/* Hero text */}
        <div className="text-center mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-[#16A34A] mb-2">FAQ</p>
          <h2 className="text-3xl font-black text-[#073729] leading-tight">
            Frequently asked<br />
            <span className="text-[#16A34A]">questions</span>
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Need help with something? Find quick answers to common questions below.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-bold text-[#073729]">{faq.q}</span>
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center transition-colors">
                  {open === i ? (
                    <Minus size={14} className="text-[#16A34A]" />
                  ) : (
                    <Plus size={14} className="text-gray-500" />
                  )}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact card */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <h3 className="text-base font-black text-[#073729]">Have any other questions?</h3>
          <p className="text-xs text-gray-500 mt-1 mb-5">
            Our support team is available 7 days a week, 7 am – 9 pm.
          </p>

          {/* Email copy row */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              support@mamafresh.co.ke
            </span>
            <button
              onClick={copyEmail}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#073729] text-white text-xs font-bold"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <a
              href="https://wa.me/254793046776"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 rounded-xl bg-[#DCFCE7] text-[#16A34A] text-xs font-black flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a
              href="tel:+254793046776"
              className="flex-1 py-3 rounded-xl bg-[#073729] text-white text-xs font-black flex items-center justify-center gap-1.5"
            >
              <Phone size={15} /> Call us
            </a>
            <a
              href="mailto:support@mamafresh.co.ke"
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-black flex items-center justify-center gap-1.5"
            >
              <Mail size={15} /> Email
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
