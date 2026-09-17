"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Power, CheckCircle2, X, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnnouncementRow } from "@/lib/supabase/types";

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient().from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements((data ?? []) as AnnouncementRow[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleActive = async (a: AnnouncementRow) => {
    const { error } = await getSupabaseBrowserClient().from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) { notify(error.message); return; }
    setAnnouncements((current) => current.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)));
    notify(a.is_active ? "Announcement hidden." : "Announcement is now live.");
  };

  const remove = async (a: AnnouncementRow) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    const { error } = await getSupabaseBrowserClient().from("announcements").delete().eq("id", a.id);
    if (error) { notify(error.message); return; }
    setAnnouncements((current) => current.filter((x) => x.id !== a.id));
    notify("Announcement deleted.");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("announcements").insert({ title: title.trim(), body: body.trim(), created_by: user?.id ?? null }).select("*").single();
    setSaving(false);
    if (error) { notify(error.message); return; }
    setAnnouncements((current) => [data as AnnouncementRow, ...current]);
    setCreating(false);
    setTitle(""); setBody("");
    notify("Announcement published to the marketplace.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-gray-500">Marketplace-wide announcements shown to shoppers</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-full bg-[#073729] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0B3D2E]">
          <Plus size={14} /> New announcement
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="p-10 text-center">
            <Megaphone className="mx-auto text-gray-300" size={28} />
            <p className="mt-2 text-sm font-bold text-gray-700">No announcements yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{a.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", a.is_active ? "bg-[#DCFCE7] text-[#15803d]" : "bg-gray-100 text-gray-500")}>{a.is_active ? "Live" : "Hidden"}</span>
                  </div>
                  {a.body && <p className="truncate text-xs text-gray-400">{a.body}</p>}
                </div>
                <button onClick={() => void toggleActive(a)} aria-label={a.is_active ? "Hide" : "Show"} className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100"><Power size={14} /></button>
                <button onClick={() => void remove(a)} aria-label="Delete" className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreating(false)}>
          <form onSubmit={create} className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">New announcement</h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-700">Title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fresh produce deals this weekend" className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">Body (optional)<textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 w-full resize-none rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#073729] py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Publishing..." : "Publish"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
