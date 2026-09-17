"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CategoryRow } from "@/lib/supabase/types";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient().from("categories").select("*").order("sort_order", { ascending: true });
    setCategories((data ?? []) as CategoryRow[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleHidden = async (cat: CategoryRow) => {
    const { error } = await getSupabaseBrowserClient().from("categories").update({ is_hidden: !cat.is_hidden, updated_at: new Date().toISOString() }).eq("id", cat.id);
    if (error) { notify(error.message); return; }
    setCategories((current) => current.map((c) => (c.id === cat.id ? { ...c, is_hidden: !c.is_hidden } : c)));
    notify(cat.is_hidden ? "Category shown to shoppers." : "Category hidden from shoppers.");
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const a = categories[index];
    const b = categories[target];
    const supabase = getSupabaseBrowserClient();
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await getSupabaseBrowserClient()
      .from("categories")
      .update({ name: editing.name, description: editing.description, updated_at: new Date().toISOString() })
      .eq("id", editing.id);
    setSaving(false);
    if (error) { notify(error.message); return; }
    setCategories((current) => current.map((c) => (c.id === editing.id ? editing : c)));
    setEditing(null);
    notify("Category updated.");
  };

  const deleteCategory = async (cat: CategoryRow) => {
    if (!confirm(`Delete "${cat.name}"? Products already using it keep their category text, but it won't be selectable anymore.`)) return;
    const { error } = await getSupabaseBrowserClient().from("categories").delete().eq("id", cat.id);
    if (error) { notify(error.message); return; }
    setCategories((current) => current.filter((c) => c.id !== cat.id));
    notify("Category deleted.");
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const slug = slugify(newName);
    const { data, error } = await getSupabaseBrowserClient()
      .from("categories")
      .insert({ id: `cat-${slug}`, name: newName.trim(), slug, description: newDescription.trim(), sort_order: categories.length })
      .select("*")
      .single();
    setSaving(false);
    if (error) { notify(error.message); return; }
    setCategories((current) => [...current, data as CategoryRow]);
    setCreating(false);
    setNewName("");
    setNewDescription("");
    notify("Category created — it's now selectable across the marketplace.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Categories</h1>
          <p className="text-xs text-gray-500">MamaFresh&apos;s grocery taxonomy — controls what sellers and shoppers see</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-full bg-[#073729] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0B3D2E]">
          <Plus size={14} /> New category
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
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map((cat, index) => (
              <div key={cat.id} className={cn("flex items-center gap-3 p-4", cat.is_hidden && "opacity-50")}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => void move(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button onClick={() => void move(index, 1)} disabled={index === categories.length - 1} aria-label="Move down" className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={12} /></button>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black" style={{ backgroundColor: cat.color }}>
                  {cat.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{cat.name}</p>
                  <p className="truncate text-xs text-gray-400">{cat.description || "No description"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{cat.priority}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => void toggleHidden(cat)} aria-label={cat.is_hidden ? "Show" : "Hide"} className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100">
                    {cat.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setEditing(cat)} aria-label="Edit" className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100"><Pencil size={14} /></button>
                  <button onClick={() => void deleteCategory(cat)} aria-label="Delete" className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">Edit category</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-700">Name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">Description<textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1 w-full resize-none rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <button onClick={() => void saveEdit()} disabled={saving} className="w-full rounded-xl bg-[#073729] py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreating(false)}>
          <form onSubmit={createCategory} className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">New category</h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-700">Name<input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Baby & Household" className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <label className="block text-xs font-bold text-gray-700">Description<textarea rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-1 w-full resize-none rounded-xl border border-gray-200 p-2.5 text-sm" /></label>
            <button type="submit" disabled={saving || !newName.trim()} className="w-full rounded-xl bg-[#073729] py-2.5 text-xs font-black text-white disabled:opacity-60">{saving ? "Creating..." : "Create category"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
