"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Camera, Loader2 } from "lucide-react";
import { TextField, SelectField } from "@/components/seller-onboarding/FormField";
import { PRODUCT_UNITS } from "@/components/seller-onboarding/constants";
import { CATEGORIES, getDefaultProductImage } from "@/lib/mock-data";
import { uploadSellerProductImage } from "@/lib/cloudinary/upload";
import { formatKSh, cn } from "@/lib/utils";
import type { ProductRow } from "@/lib/supabase/types";

interface Props {
  products: ProductRow[];
  onAdd: (input: { name: string; category: string; subcategory: string; price: number; unit: string; stock: number; available: boolean; imageUrl?: string }) => Promise<{ error: string | null }>;
  onUpdate: (id: string, patch: Partial<Pick<ProductRow, "name" | "category" | "price" | "unit" | "stock_quantity" | "is_available" | "image_url">>) => Promise<{ error: string | null }>;
  onRemove: (id: string) => Promise<{ error: string | null }>;
  canAddProducts: boolean;
}

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.name, label: c.name }));

const emptyDraft = { name: "", category: CATEGORIES[0].name, subcategory: "", price: "", unit: "kg", stock: "", available: true, imageUrl: "" };

export default function StepProducts({ products, onAdd, onUpdate, onRemove, canAddProducts }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setErrors({});
    setFormError(null);
    setImageError(null);
    setShowForm(true);
  };

  const openEditForm = (product: ProductRow) => {
    setDraft({
      name: product.name,
      category: product.category,
      subcategory: "",
      price: String(product.price),
      unit: product.unit,
      stock: String(product.stock_quantity),
      available: product.is_available,
      imageUrl: product.image_url || "",
    });
    setEditingId(product.id);
    setErrors({});
    setFormError(null);
    setImageError(null);
    setShowForm(true);
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageError(null);
    setUploadingImage(true);
    try {
      const url = await uploadSellerProductImage(file);
      setDraft((d) => ({ ...d, imageUrl: url }));
      // Editing an existing product: save the photo immediately so it's not lost if the form is closed early.
      if (editingId) await onUpdate(editingId, { image_url: url });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Unable to upload that photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim() || draft.name.trim().length < 2) next.name = "Product name is required.";
    if (!draft.category) next.category = "Category is required.";
    const price = Number(draft.price);
    if (!draft.price.trim() || Number.isNaN(price) || price < 0) next.price = "Enter a valid price (0 or more).";
    if (!draft.unit) next.unit = "Unit is required.";
    if (draft.stock.trim()) {
      const stock = Number(draft.stock);
      if (Number.isNaN(stock) || stock < 0) next.stock = "Stock must be 0 or more.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      name: draft.name.trim(),
      category: draft.category,
      subcategory: draft.subcategory,
      price: Number(draft.price),
      unit: draft.unit,
      stock: draft.stock.trim() ? Number(draft.stock) : 0,
      available: draft.available,
      imageUrl: draft.imageUrl,
    };
    const result = editingId
      ? await onUpdate(editingId, { name: payload.name, category: payload.category, price: payload.price, unit: payload.unit, stock_quantity: payload.stock, is_available: payload.available, image_url: payload.imageUrl })
      : await onAdd(payload);
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {!canAddProducts && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">Finish your shop details in the earlier steps before adding products.</p>
      )}

      {products.length === 0 && !showForm && (
        <p className="text-xs text-gray-500">Add at least one product to help customers find you sooner — or skip for now and add products later from your dashboard.</p>
      )}

      <div className="space-y-2.5">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-xs">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              <Image src={product.image_url || getDefaultProductImage(product.name, product.category)} alt={product.name} fill className="object-contain p-1" sizes="48px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
              <p className="text-[11px] text-gray-400">{formatKSh(product.price)} / {product.unit} · {product.stock_quantity} {product.unit} available</p>
            </div>
            <button type="button" onClick={() => openEditForm(product)} aria-label={`Edit ${product.name}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-[#073729]"><Pencil size={14} /></button>
            <button type="button" onClick={() => void onRemove(product.id)} aria-label={`Remove ${product.name}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={openAddForm}
          disabled={!canAddProducts}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> Add Product
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-[#F8FAF9] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-[#073729]">{editingId ? "Edit Product" : "Add Product"}</p>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close" className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              aria-label="Upload product photo"
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white disabled:opacity-60"
            >
              {uploadingImage ? (
                <span className="flex h-full w-full items-center justify-center text-gray-400"><Loader2 size={18} className="animate-spin" /></span>
              ) : draft.imageUrl ? (
                <Image src={draft.imageUrl} alt="" fill className="object-contain p-1" sizes="64px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-gray-300"><Camera size={20} /></span>
              )}
            </button>
            <div className="min-w-0">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="text-xs font-bold text-[#16A34A] hover:underline disabled:opacity-60">
                {draft.imageUrl ? "Change photo" : "Upload a photo"}
              </button>
              <p className="mt-0.5 text-[10px] text-gray-400">A default image is used until you upload one.</p>
              {imageError && <p className="mt-1 text-[10px] font-semibold text-red-600">{imageError}</p>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoSelected(e)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Product Name" required value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Tomatoes" error={errors.name} />
            <SelectField label="Category" required value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} options={CATEGORY_OPTIONS} error={errors.category} />
            <TextField label="Subcategory" value={draft.subcategory} onChange={(v) => setDraft((d) => ({ ...d, subcategory: v }))} placeholder="Optional" />
            <TextField label="Price (KSh)" required value={draft.price} onChange={(v) => setDraft((d) => ({ ...d, price: v }))} placeholder="120" type="number" error={errors.price} />
            <SelectField label="Unit" required value={draft.unit} onChange={(v) => setDraft((d) => ({ ...d, unit: v }))} options={PRODUCT_UNITS} error={errors.unit} />
            <TextField label="Stock Quantity" value={draft.stock} onChange={(v) => setDraft((d) => ({ ...d, stock: v }))} placeholder="15" type="number" error={errors.stock} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-700">
            <input type="checkbox" checked={draft.available} onChange={(e) => setDraft((d) => ({ ...d, available: e.target.checked }))} className="h-4 w-4 accent-[#16A34A]" />
            Available for sale
          </label>
          {formError && <p className="mt-3 text-xs font-semibold text-red-600">{formError}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="min-h-11 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={() => void submit()} disabled={saving} className={cn("min-h-11 flex-1 rounded-xl bg-[#16A34A] text-sm font-bold text-white hover:bg-[#15803d]", saving && "opacity-60")}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
