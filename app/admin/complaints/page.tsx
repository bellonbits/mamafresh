"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Phone, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ComplaintRow, ComplaintStatus } from "@/lib/supabase/types";

type ComplaintWithRelations = ComplaintRow & {
  profiles: { full_name: string; phone: string } | null;
  sellers: { name: string; phone: string } | null;
};

const STATUS_TABS: { key: ComplaintStatus | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  open: "bg-red-50 text-red-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-[#DCFCE7] text-[#15803d]",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ComplaintStatus | "all">("open");
  const [selected, setSelected] = useState<ComplaintWithRelations | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient()
      .from("complaints")
      .select("*, profiles(full_name, phone), sellers(name, phone)")
      .order("created_at", { ascending: false });
    setComplaints((data ?? []) as unknown as ComplaintWithRelations[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const openDetail = (complaint: ComplaintWithRelations) => {
    setSelected(complaint);
    setResolutionNotes(complaint.resolution_notes);
  };

  const updateStatus = async (status: ComplaintStatus) => {
    if (!selected) return;
    setSaving(true);
    const { error } = await getSupabaseBrowserClient()
      .from("complaints")
      .update({ status, resolution_notes: resolutionNotes, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { notify(error.message); return; }
    setComplaints((current) => current.map((c) => (c.id === selected.id ? { ...c, status, resolution_notes: resolutionNotes } : c)));
    setSelected((current) => (current ? { ...current, status, resolution_notes: resolutionNotes } : current));
    notify(status === "resolved" ? "Complaint marked resolved." : "Complaint updated.");
  };

  const filtered = tab === "all" ? complaints : complaints.filter((c) => c.status === tab);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Complaints</h1>
        <p className="text-xs text-gray-500">Customer-reported problems, from order issues to marketplace concerns</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
              tab === t.key ? "bg-[#073729] text-white" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto text-gray-300" size={28} />
            <p className="mt-2 text-sm font-bold text-gray-700">No complaints here</p>
            <p className="mt-1 text-xs text-gray-400">Nothing in this status right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => openDetail(c)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{c.subject}</p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[c.status])}>{c.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {c.profiles?.full_name || "Customer"} {c.sellers?.name ? `· ${c.sellers.name}` : ""} {c.order_id ? `· Order #${c.order_id.slice(0, 8).toUpperCase()}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Complaint #{selected.id.slice(0, 8).toUpperCase()}</h2>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[selected.status])}>{selected.status.replace("_", " ")}</span>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="space-y-2 text-xs">
              <p><span className="font-bold text-gray-500">Customer:</span> {selected.profiles?.full_name || "Customer"}</p>
              {selected.sellers?.name && <p><span className="font-bold text-gray-500">Seller:</span> {selected.sellers.name}</p>}
              {selected.order_id && <p><span className="font-bold text-gray-500">Order:</span> <Link href={`/orders/${selected.order_id}`} className="text-[#16A34A] hover:underline">#{selected.order_id.slice(0, 8).toUpperCase()}</Link></p>}
              <p><span className="font-bold text-gray-500">Subject:</span> {selected.subject}</p>
              {selected.description && <p className="rounded-xl bg-gray-50 p-2.5 text-gray-700">{selected.description}</p>}
            </div>

            <div className="flex gap-2">
              {selected.profiles?.phone && (
                <a href={`tel:${selected.profiles.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                  <Phone size={13} /> Call customer
                </a>
              )}
              {selected.sellers?.phone && (
                <a href={`https://wa.me/${selected.sellers.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#DCFCE7] py-2.5 text-xs font-bold text-[#16A34A] hover:bg-[#bbf7d0]">
                  <MessageCircle size={13} /> WhatsApp seller
                </a>
              )}
            </div>

            <label className="block text-xs font-bold text-gray-700">
              Resolution notes
              <textarea rows={3} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="How was this resolved?" className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 p-2.5 text-sm" />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button disabled={saving} onClick={() => void updateStatus("in_progress")} className="rounded-xl bg-amber-50 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-60">
                Mark in progress
              </button>
              <button disabled={saving} onClick={() => void updateStatus("resolved")} className="rounded-xl bg-[#073729] py-2.5 text-xs font-bold text-white hover:bg-[#0B3D2E] disabled:opacity-60">
                Mark resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
