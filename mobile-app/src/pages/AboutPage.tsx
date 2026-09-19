import Image from "@/lib/next-compat/image";
import Link from "@/lib/next-compat/link";
import { ArrowRight, Heart, MapPin, ShieldCheck, Sprout, Users } from "lucide-react";
import CountUpStat from "@/components/CountUpStat";

const stats = [
  ["1,000+", "Neighborhood orders"],
  ["48", "Fresh products"],
  ["98%", "Happy customers"],
  ["30 min", "Fast delivery"],
];

export default function AboutPage() {
  return (
    <div className="bg-[#F7F8F6] animate-fade-in">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#16A34A]">About MamaFresh</p><h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-[#073729] sm:text-5xl lg:text-6xl">Fresh food, closer to home.</h1><p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">We connect neighborhood mama mbogas with households looking for fresh, affordable produce delivered with care across East Africa.</p><Link href="/shops" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#073729] px-5 py-3 text-xs font-black text-white">Explore the marketplace <ArrowRight size={14} /></Link></div>
          <div className="relative h-64 overflow-hidden rounded-2xl bg-[#DDE9D8] sm:h-80 lg:h-[380px]"><Image src="/images/marketing/market-stall.jpg" alt="Fresh vegetables from MamaFresh sellers" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" /><div className="absolute inset-0 bg-gradient-to-t from-[#073729]/40 to-transparent" /><div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[#073729]"><MapPin size={14} className="text-[#16A34A]" /> Across East Africa</div></div>
        </section>

        <section className="mt-12 grid grid-cols-2 gap-4 border-y border-gray-200 py-7 sm:grid-cols-4 lg:mt-16">{stats.map(([value, label]) => <div key={label}><CountUpStat value={value} className="text-2xl font-black text-[#073729] sm:text-3xl" /><p className="mt-1 text-xs text-gray-500">{label}</p></div>)}</section>

        <section className="grid gap-10 py-12 lg:grid-cols-[.8fr_1.2fr] lg:py-16"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#16A34A]">Why we exist</p><h2 className="mt-3 text-3xl font-black leading-tight text-[#073729] sm:text-4xl">Empowering local sellers and everyday shoppers.</h2></div><div className="grid gap-8 sm:grid-cols-2"><article><Heart className="text-[#16A34A]" size={22} /><h3 className="mt-3 text-lg font-bold text-[#073729]">Our mission</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">MamaFresh gives mama mbogas simple digital tools and gives families convenient access to fresh, healthy food at fair prices.</p></article><article><ShieldCheck className="text-[#16A34A]" size={22} /><h3 className="mt-3 text-lg font-bold text-[#073729]">Our promise</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">Produce is sourced from trusted local networks, handled with care, and delivered quickly from a seller near you.</p></article></div></section>

        <section className="grid overflow-hidden rounded-2xl bg-[#073729] text-white lg:grid-cols-2"><div className="p-7 sm:p-10 lg:p-14"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#B8EF4A]">How it works</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">From local stall to your table.</h2><div className="mt-8 space-y-5"><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8EF4A] text-sm font-black text-[#073729]">01</span><div><h3 className="font-bold">Choose your neighborhood shop</h3><p className="mt-1 text-xs leading-relaxed text-emerald-100/70">Browse trusted nearby sellers and their fresh catalogues.</p></div></div><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8EF4A] text-sm font-black text-[#073729]">02</span><div><h3 className="font-bold">Fill your basket</h3><p className="mt-1 text-xs leading-relaxed text-emerald-100/70">Pick the produce you need at stall-direct prices.</p></div></div><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8EF4A] text-sm font-black text-[#073729]">03</span><div><h3 className="font-bold">Get it delivered fresh</h3><p className="mt-1 text-xs leading-relaxed text-emerald-100/70">Our neighborhood network brings it to your door.</p></div></div></div></div><div className="relative min-h-64 lg:min-h-full"><Image src="/images/marketing/delivery.jpg" alt="MamaFresh rider delivering fresh produce" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div></section>

        <section className="relative my-12 overflow-hidden rounded-2xl py-16 text-center sm:py-20">
          <Image src="/images/marketing/supermarket-banner.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-[#073729]/80" />
          <div className="relative z-10 px-6">
            <Sprout className="mx-auto text-[#B8EF4A]" size={28} />
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">Better for sellers. Better for families.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-emerald-100/80">Every order helps strengthen the local food economy while making it easier for families to eat well.</p>
            <Link href="/shops" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#B8EF4A] px-5 py-3 text-xs font-black text-[#073729]">Start shopping <ArrowRight size={15} /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
