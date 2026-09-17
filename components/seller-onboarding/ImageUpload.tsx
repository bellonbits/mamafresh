"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  ownerId: string;
  aspect?: "square" | "wide";
}

export default function ImageUpload({ label, value, onChange, ownerId, aspect = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${ownerId}/${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("seller-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("seller-assets").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-gray-700">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />

      {value ? (
        <div className={aspect === "wide" ? "relative h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50" : "relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"}>
          <Image src={value} alt={label} fill className="object-cover" sizes="200px" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/50 p-1.5">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-800">
              <RefreshCw size={10} /> Change
            </button>
            <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-red-600">
              <X size={10} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={
            (aspect === "wide" ? "h-28 w-full" : "h-24 w-24") +
            " flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
          }
        >
          <Upload size={18} />
          <span className="text-[10px] font-bold">{uploading ? "Uploading..." : `Upload ${label}`}</span>
        </button>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
