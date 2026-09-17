"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, CheckCircle2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ServiceAreaRow } from "@/lib/supabase/types";

export default function AdminLocationsPage() {
  const [areas, setAreas] = useState<ServiceAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("Kenya");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient().from("service_areas").select("*").order("country").order("city").order("sort_order");
    setAreas((data ?? []) as ServiceAreaRow[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleActive = async (area: ServiceAreaRow) => {
    const { error } = await getSupabaseBrowserClient().from("service_areas").update({ is_active: !area.is_active }).eq("id", area.id);
    if (error) { notify(error.message); return; }
    setAreas((current) => current.map((a) => (a.id === area.id ? { ...a, is_active: !a.is_active } : a)));
    notify(area.is_active ? "Area disabled." : "Area enabled.");
  };

  const deleteArea = async (area: ServiceAreaRow) => {
    if (!confirm(`Remove "${area.name}, ${area.city}" from service areas?`)) return;
    const { error } = await getSupabaseBrowserClient().from("service_areas").delete().eq("id", area.id);
    if (error) { notify(error.message); return; }
    setAreas((current) => current.filter((a) => a.id !== area.id));
    notify("Area removed.");
  };

  const createArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) return;
    setSaving(true);
    const { data, error } = await getSupabaseBrowserClient()
      .from("service_areas")
      .insert({ name: newName.trim(), city: newCity.trim(), country: newCountry.trim() || "Kenya", sort_order: areas.length })
      .select("*")
      .single();
    setSaving(false);
    if (error) { notify(error.message); return; }
    setAreas((current) => [...current, data as ServiceAreaRow]);
    setCreating(false);
    setNewName("");
    setNewCity("");
    notify("Service area added.");
  };

  const grouped = areas.reduce<Record<string, ServiceAreaRow[]>>((acc, a) => {
    const key = `${a.country} · ${a.city}`;
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Service Areas</h1>
          <p className="text-xs text-gray-500">Where MamaFresh operates — controls delivery-area pickers across the app</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-full bg-[#073729] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0B3D2E]">
          <Plus size={14} /> New area
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {loading ? (
        <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupAreas]) => (
            <div key={group} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-black text-gray-700">{group}</div>
              <div className="divide-y divide-gray-50">
                {groupAreas.map((area) => (
                  <div key={area.id} className={cn("flex items-center gap-3 p-3.5", !area.is_active && "opacity-50")}>
                    <MapPin size={14} className="shrink-0 text-[#16A34A]" />
                    <span className="flex-1 text-sm font-bold text-gray-900">{area.name}</span>
                    <button onClick={() => void toggleActive(area)} aria-label={area.is_active ? "Disable" : "Enable"} className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100">
                      {area.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => void deleteArea(area)} aria-label="Delete" className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreating(false)}>
          <form onSubmit={createArea} className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">New service area</h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-700">Neighborhood<input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Muthaiga" className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">City<input required value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="e.g. Nairobi" className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">Country<input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#073729] py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Adding..." : "Add area"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
