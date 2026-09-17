"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Pencil, X, CheckCircle2, Upload, RefreshCw, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/cloudinary/upload";
import type { ProductRow, ProductImageRow } from "@/lib/supabase/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState<ProductImageRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await getSupabaseBrowserClient().from("products").select("*").order("name");
        if (error) throw error;
        if (active) {
          setProducts((data ?? []) as ProductRow[]);
          setLoadError(null);
        }
      } catch (fetchError) {
        if (active) setLoadError(fetchError instanceof Error ? fetchError.message : "Unable to load products.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadProducts();
    return () => { active = false; };
  }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const openEditor = (product: ProductRow) => {
    setImageError(null);
    setEditing({ ...product });
    setGallery([]);
    setGalleryLoading(true);
    void getSupabaseBrowserClient()
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setGallery((data ?? []) as ProductImageRow[]);
        setGalleryLoading(false);
      });
  };

  const addGalleryImage = async (file: File | undefined) => {
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) { setImageError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setImageError("Image must be under 8MB."); return; }
    setUploadingGalleryImage(true);
    setImageError(null);
    try {
      const url = await uploadProductImage(file);
      const { data, error } = await getSupabaseBrowserClient()
        .from("product_images")
        .insert({ product_id: editing.id, url, sort_order: gallery.length })
        .select("*")
        .single();
      if (error) throw error;
      setGallery((current) => [...current, data as ProductImageRow]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Unable to upload image.");
    } finally {
      setUploadingGalleryImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = async (image: ProductImageRow) => {
    const { error } = await getSupabaseBrowserClient().from("product_images").delete().eq("id", image.id);
    if (error) { notify(error.message); return; }
    setGallery((current) => current.filter((g) => g.id !== image.id));
  };

  const handleDeleteProduct = async (product: ProductRow) => {
    if (!confirm(`Permanently delete "${product.name}"? This cannot be undone.`)) return;
    const { error } = await getSupabaseBrowserClient().from("products").delete().eq("id", product.id);
    if (error) {
      notify(error.code === "23503" ? "This product has order history and can't be deleted — mark it unavailable instead." : error.message);
      return;
    }
    setProducts((current) => current.filter((p) => p.id !== product.id));
    notify(`${product.name} deleted.`);
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("Image must be under 8MB.");
      return;
    }
    setUploadingImage(true);
    setImageError(null);
    try {
      const url = await uploadProductImage(file);
      setEditing((current) => (current ? { ...current, image_url: url } : current));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("products")
        .update({
          name: editing.name,
          price: editing.price,
          unit: editing.unit,
          stock_quantity: editing.stock_quantity,
          is_available: editing.is_available,
          is_featured: editing.is_featured,
          image_url: editing.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) throw error;
      setProducts((current) => current.map((product) => product.id === editing.id ? editing : product));
      setEditing(null);
      notify("Product updated in Supabase.");
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.is_featured;
          void (async () => {
            const { error } = await getSupabaseBrowserClient()
              .from("products")
              .update({ is_featured: next, updated_at: new Date().toISOString() })
              .eq("id", p.id);
            if (error) notify(error.message);
          })();
          notify(`${p.name} ${next ? "featured on homepage" : "removed from featured"}`);
          return { ...p, is_featured: next };
        }
        return p;
      })
    );
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.seller_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Catalog Moderation</h1>
          <p className="text-xs text-gray-500">Curate marketplace items, featured promotions, and stock health</p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs">
          {products.length} Products Cataloged
        </span>
      </div>

      {toast && (
        <div className="bg-[#DCFCE7] border border-[#B6E2BA] text-[#15803d] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold">
          {loadError}
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, sellers, or categories..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="min-w-0 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="p-3.5">Produce Item</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Price / Unit</th>
                <th className="p-3.5">Stock Level</th>
                <th className="p-3.5 text-center">Featured on Home</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs font-bold text-gray-400">
                    Loading products...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs font-bold text-gray-400">
                    No products found.
                  </td>
                </tr>
              )}
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image
                          src={prod.image_url}
                          alt={prod.name}
                          fill
                          className="object-contain p-1"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm leading-tight">{prod.name}</p>
                        <p className="text-[11px] text-gray-400">{prod.weight || prod.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase">
                      {prod.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-gray-700">{prod.seller_name}</td>
                  <td className="p-3.5 font-bold text-[#073729]">
                    KSh {Math.round(prod.price)} / {prod.unit}
                  </td>
                  <td className="p-3.5">
                    <span className={cn(
                      "font-bold text-xs",
                      prod.stock_quantity > 20 ? "text-[#16A34A]" : "text-amber-600 font-black"
                    )}>
                      {prod.stock_quantity} {prod.unit}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => toggleFeatured(prod.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95",
                        prod.is_featured
                          ? "bg-[#DCFCE7] text-[#15803d]"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      )}
                    >
                      {prod.is_featured ? "★ Featured" : "☆ Promote"}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditor(prod)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => void handleDeleteProduct(prod)}
                        title="Delete Product"
                        className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={saveProduct} onClick={(event) => event.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Edit product</h2>
                <p className="text-xs text-gray-500">Changes are saved to Supabase.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div>
              <span className="mb-1 block text-xs font-bold text-gray-700">Product image</span>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageFile(event.target.files?.[0])} />
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {editing.image_url && <Image src={editing.image_url} alt={editing.name} fill className="object-cover" sizes="64px" />}
                </div>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  {uploadingImage ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploadingImage ? "Uploading..." : "Change image"}
                </button>
              </div>
              {imageError && <p className="mt-1 text-[11px] font-semibold text-red-600">{imageError}</p>}
            </div>

            <div>
              <span className="mb-1 block text-xs font-bold text-gray-700">Additional photos <span className="font-normal text-gray-400">(shown in the product gallery)</span></span>
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void addGalleryImage(event.target.files?.[0])} />
              <div className="flex flex-wrap gap-2">
                {galleryLoading ? (
                  <p className="text-[11px] text-gray-400">Loading gallery...</p>
                ) : (
                  gallery.map((img) => (
                    <div key={img.id} className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                      <button
                        type="button"
                        onClick={() => void removeGalleryImage(img)}
                        aria-label="Remove photo"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGalleryImage}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#16A34A] hover:text-[#16A34A] disabled:opacity-60"
                >
                  {uploadingGalleryImage ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>
            </div>

            <label className="block text-xs font-bold text-gray-700">Name<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" required /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-gray-700">Price<input type="number" min="0" step="0.01" value={editing.price} onChange={(event) => setEditing({ ...editing, price: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" required /></label>
              <label className="text-xs font-bold text-gray-700">Unit<input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" required /></label>
            </div>
            <label className="block text-xs font-bold text-gray-700">Stock quantity<input type="number" min="0" value={editing.stock_quantity} onChange={(event) => setEditing({ ...editing, stock_quantity: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm" required /></label>
            <div className="flex gap-5 text-xs font-bold text-gray-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_available} onChange={(event) => setEditing({ ...editing, is_available: event.target.checked })} /> Available</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_featured} onChange={(event) => setEditing({ ...editing, is_featured: event.target.checked })} /> Featured</label>
            </div>
            <button type="submit" disabled={saving || uploadingImage} className="w-full rounded-xl bg-[#073729] py-3 text-xs font-black text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
