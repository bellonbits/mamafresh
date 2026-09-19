
import { FormEvent, useState } from "react";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";

const contactOptions = [
  { label: "Customer line", value: "+254 793 046 776", detail: "Mon - Sun, 6:00 AM - 9:00 PM", icon: Phone, href: "tel:+254793046776" },
  { label: "WhatsApp quick care", value: "Chat with our team", detail: "Average reply under 3 minutes", icon: MessageCircle, href: "https://wa.me/254793046776" },
  { label: "Email support", value: "support@mamafresh.ke", detail: "General inquiries and partnerships", icon: Mail, href: "mailto:support@mamafresh.ke" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <div className="bg-[#F4F7F4] animate-fade-in">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-8 lg:p-14"><div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(22,163,74,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(22,163,74,.08)_1px,transparent_1px)] [background-size:72px_72px]" /><div className="relative grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16"><div className="flex flex-col justify-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#16A34A]">Home / Contact</p><h1 className="mt-5 max-w-lg text-5xl font-black leading-[.95] tracking-tight text-[#073729] sm:text-6xl lg:text-7xl">Let&apos;s get<br /><span className="text-[#16A34A]">in touch</span></h1><p className="mt-5 max-w-sm text-lg font-bold leading-tight text-[#073729]">Have a question about your order or want to join the marketplace?</p><div className="mt-8 space-y-2">{contactOptions.map(({ label, value, detail, icon: Icon, href }) => <a key={label} href={href} className="group flex items-center gap-3 border-b border-[#16A34A]/15 py-3 text-[#073729]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F4D2] text-[#16A34A] shadow-sm"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-[10px] text-gray-500">{label}</span><span className="block truncate text-sm font-bold">{value}</span><span className="block text-[10px] text-gray-500">{detail}</span></span><ArrowUpRight size={15} className="text-[#16A34A] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}</div><div className="mt-7 flex items-center gap-2 text-xs text-gray-600"><MapPin size={16} className="text-[#16A34A]" /> Kasarani Center, Off Thika Road, Nairobi</div></div>
          <div className="rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(7,55,41,.12)] sm:p-8"><div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#16A34A]">Send a message</p><h2 className="mt-2 text-2xl font-black text-[#073729]">Contact MamaFresh</h2><p className="mt-1 text-sm text-gray-500">Our support team will get back to you shortly.</p></div><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-gray-700">Name<input required name="name" placeholder="Your name" className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-normal outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15" /></label><label className="text-xs font-bold text-gray-700">Email<input required type="email" name="email" placeholder="you@example.com" className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-normal outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-gray-700">Phone number<input name="phone" placeholder="+254 700 000 000" className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-normal outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15" /></label><label className="text-xs font-bold text-gray-700">Subject<input required name="subject" placeholder="How can we help?" className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-normal outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15" /></label></div><label className="block text-xs font-bold text-gray-700">Message<textarea required name="message" rows={6} placeholder="Tell us what you need help with..." className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-normal outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15" /></label><button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#073729] text-sm font-bold text-white shadow-lg shadow-[#073729]/20 transition hover:bg-[#0B3D2E]" type="submit">{sent ? "Message sent" : "Send message"} <Send size={16} /></button><p className="text-[10px] leading-relaxed text-gray-400">By sending this message, you agree that MamaFresh may use your details to respond to your request.</p></form></div></div></section>
      </main>
    </div>
  );
}
