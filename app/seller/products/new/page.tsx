"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Camera, Sparkles, Loader2 } from "lucide-react";
import { getDefaultProductImage } from "@/lib/mock-data";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { useCategories } from "@/lib/hooks/useCategories";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadSellerProductImage } from "@/lib/cloudinary/upload";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading...</div>}>
      <AddProductForm />
    </Suspense>
  );
}

function AddProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const { categories, loading: categoriesLoading } = useCategories();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("25");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    void getSupabaseBrowserClient().from("products").select("*").eq("id", editId).maybeSingle().then(({ data }) => {
      if (!active || !data) return;
      setName(data.name);
      setCategory(data.category);
      setPrice(String(data.price));
      setUnit(data.unit);
      setStock(String(data.stock_quantity));
      setDescription(data.description ?? "");
      setAvailable(data.is_available);
      setImageUrl(data.image_url ?? "");
      setLoadingProduct(false);
    });
    return () => { active = false; };
  }, [editId]);

  useEffect(() => {
    if (editId || category || categories.length === 0) return;
    queueMicrotask(() => setCategory(categories[0].name));
  }, [editId, category, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !seller) return;
    setSaving(true);
    setError(null);

    const categoryMeta = categories.find((c) => c.name === category);
    const payload = {
      seller_id: seller.id,
      seller_name: seller.name,
      seller_slug: seller.slug,
      name: name.trim(),
      price: Number(price),
      original_price: Number(price),
      unit,
      stock_quantity: Number(stock) || 0,
      description,
      is_available: available,
      category,
      category_slug: categoryMeta?.slug ?? slugify(category),
      image_url: imageUrl || getDefaultProductImage(name, category),
    };

    const { error: saveError } = editId
      ? await getSupabaseBrowserClient().from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId)
      : await getSupabaseBrowserClient().from("products").insert({
          ...payload,
          id: `${seller.id}-${slugify(name)}-${Date.now().toString(36)}`,
        });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setTimeout(() => {
      router.push("/seller/products");
    }, 1200);
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageError(null);
    setUploadingImage(true);
    try {
      const url = await uploadSellerProductImage(file);
      setImageUrl(url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Unable to upload that photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const generateDescription = async () => {
    if (!name.trim()) {
      setError("Enter a product name first so AI knows what to describe.");
      return;
    }
    setGeneratingDescription(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price) || undefined, unit, category }),
      });
      const result = await response.json() as { description?: string; error?: string };
      if (!response.ok || !result.description) throw new Error(result.error ?? "Unable to generate a description.");
      setDescription(result.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate a description.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  if (sellerLoading || loadingProduct) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">You don&apos;t have a shop yet</p>
        <button onClick={() => router.push("/seller/register")} className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Register your shop</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] p-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-black text-[#0B3D2E]">{editId ? "Edit Product" : "Add Product to Stall"}</h1>
          <p className="text-xs text-gray-500">Quick product entry form</p>
        </div>
      </div>

      {/* Ultra-Simple Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto lg:max-w-lg">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
        {/* Photo Upload Box */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-full bg-white rounded-2xl p-4 border border-dashed border-emerald-300 text-center flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-emerald-50/40 transition-colors disabled:opacity-60"
        >
          {imageUrl ? (
            <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-xl bg-gray-50">
              <Image src={imageUrl} alt="" fill className="object-contain p-1" sizes="64px" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#15803d] flex items-center justify-center mb-2">
              {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Camera size={22} />}
            </div>
          )}
          <p className="text-xs font-bold text-gray-800">
            {uploadingImage ? "Uploading..." : imageUrl ? "Tap to change photo" : "Tap to snap or upload produce photo"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">A default image is used until you upload one</p>
          {imageError && <p className="mt-1 text-[10px] font-semibold text-red-600">{imageError}</p>}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoSelected(e)} />

        {/* Product Name */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div>
            <label className="text-xs font-extrabold text-gray-700 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tomatoes (Nyanya), Spinach"
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-extrabold text-gray-700 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={categoriesLoading}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-extrabold text-gray-700">Description</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDescription}
                className="flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#15803d] disabled:opacity-60"
              >
                <Sparkles size={11} />
                {generatingDescription ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this produce good? Or tap Generate with AI once you've filled in the name."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-extrabold text-gray-700 block mb-1">
                Price (KSh) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 80"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-700 block mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="kg">per kg</option>
                <option value="bunch">per bunch</option>
                <option value="piece">per piece</option>
                <option value="500g">per 500g</option>
                <option value="litre">per litre</option>
              </select>
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="text-xs font-extrabold text-gray-700 block mb-1">
              Available Stock
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 25"
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          {/* Available Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-gray-800">Available for Order</p>
              <p className="text-[10px] text-gray-400">Show to nearby customers</p>
            </div>
            <button
              type="button"
              onClick={() => setAvailable(!available)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                available ? "bg-[#16A34A]" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  available ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-[#0B3D2E] hover:bg-[#166534] text-white text-xs font-black shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {saved ? "Product Saved to Stall!" : saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
