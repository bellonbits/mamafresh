"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, SellerRow } from "@/lib/supabase/types";

export interface OnboardingForm {
  // Step 1 — Account
  fullName: string;
  accountEmail: string;
  accountPhone: string;
  password: string;
  // Step 2 — Seller information
  ownerName: string;
  sellerPhone: string;
  sellerEmail: string;
  businessType: string;
  businessRegNumber: string;
  // Step 3 — Shop information
  shopName: string;
  shopDescription: string;
  shopPhone: string;
  shopWhatsapp: string;
  primaryCategory: string;
  logoUrl: string;
  bannerUrl: string;
  // Step 4 — Location
  area: string;
  areaOther: string;
  street: string;
  landmark: string;
  county: string;
  subCounty: string;
  locationNotes: string;
  // Step 5 — Categories
  categories: string[];
}

export const EMPTY_FORM: OnboardingForm = {
  fullName: "",
  accountEmail: "",
  accountPhone: "",
  password: "",
  ownerName: "",
  sellerPhone: "",
  sellerEmail: "",
  businessType: "",
  businessRegNumber: "",
  shopName: "",
  shopDescription: "",
  shopPhone: "",
  shopWhatsapp: "",
  primaryCategory: "",
  logoUrl: "",
  bannerUrl: "",
  area: "",
  areaOther: "",
  street: "",
  landmark: "",
  county: "Nairobi",
  subCounty: "",
  locationNotes: "",
  categories: [],
};

function sellerToForm(seller: SellerRow, fallback: OnboardingForm): OnboardingForm {
  return {
    ...fallback,
    ownerName: fallback.ownerName,
    businessType: seller.business_type,
    businessRegNumber: seller.business_registration_number,
    shopName: seller.name,
    shopDescription: seller.description,
    shopPhone: seller.phone,
    shopWhatsapp: seller.whatsapp,
    primaryCategory: seller.categories[0] ?? "",
    logoUrl: seller.logo_url,
    bannerUrl: seller.banner_url,
    area: seller.location,
    street: seller.estate,
    landmark: seller.landmark,
    county: seller.county || "Nairobi",
    subCounty: seller.sub_county,
    locationNotes: seller.location_notes,
    categories: seller.categories,
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export type AuthState = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; id: string; email: string };

export function useSellerOnboarding() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<SellerRow["status"] | null>(null);
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [resumed, setResumed] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [draftError, setDraftError] = useState<string | null>(null);
  const sellerIdRef = useRef<string | null>(null);
  useEffect(() => { sellerIdRef.current = sellerId; }, [sellerId]);

  const loadDraft = useCallback(async () => {
    setLoadingDraft(true);
    setDraftError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuth({ status: "signed-out" });
        setLoadingDraft(false);
        return;
      }
      setAuth({ status: "signed-in", id: user.id, email: user.email ?? "" });

      const [{ data: profile }, { data: existing, error }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("sellers").select("*").eq("owner_id", user.id).maybeSingle(),
      ]);
      if (error) throw error;

      setForm((current) => ({
        ...current,
        fullName: profile?.full_name || current.fullName,
        accountEmail: user.email ?? "",
        accountPhone: profile?.phone || current.accountPhone,
        ownerName: profile?.full_name || current.ownerName,
        sellerPhone: profile?.phone || current.sellerPhone,
        sellerEmail: user.email ?? "",
      }));

      if (existing) {
        setExistingStatus(existing.status);
        if (existing.status === "draft") {
          setSellerId(existing.id);
          setForm((current) => sellerToForm(existing as SellerRow, current));
          setStep(Math.min(Math.max(existing.onboarding_step, 1), 7));
          setResumed(true);
          const { data: existingProducts } = await supabase.from("products").select("*").eq("seller_id", existing.id);
          setProducts((existingProducts ?? []) as ProductRow[]);
        }
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Unable to load your account.");
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadDraft(); });
  }, [loadDraft]);

  const updateForm = useCallback(<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleCategory = useCallback((value: string) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((c) => c !== value)
        : [...current.categories, value],
    }));
  }, []);

  /** Create (once) or update the draft seller row, keyed by the current auth user. */
  const persistDraft = useCallback(async (patch: Partial<OnboardingForm>, onboardingStep: number): Promise<{ error: string | null }> => {
    if (auth.status !== "signed-in") return { error: "Please sign in to continue." };
    const supabase = getSupabaseBrowserClient();
    const merged = { ...form, ...patch };

    const area = merged.area === "__other__" ? merged.areaOther : merged.area;
    const categories = merged.primaryCategory && !merged.categories.includes(merged.primaryCategory)
      ? [merged.primaryCategory, ...merged.categories]
      : merged.categories;

    const payload = {
      name: merged.shopName,
      description: merged.shopDescription,
      phone: merged.shopPhone,
      whatsapp: merged.shopWhatsapp,
      business_type: merged.businessType,
      business_registration_number: merged.businessRegNumber,
      logo_url: merged.logoUrl,
      banner_url: merged.bannerUrl,
      location: area,
      estate: merged.street,
      landmark: merged.landmark,
      county: merged.county,
      sub_county: merged.subCounty,
      location_notes: merged.locationNotes,
      categories,
      onboarding_step: onboardingStep,
    };

    try {
      // Also keep the account identity (name/phone) in sync on the profile.
      if (patch.ownerName !== undefined || patch.sellerPhone !== undefined) {
        await supabase.from("profiles").update({
          full_name: merged.ownerName || merged.fullName,
          phone: merged.sellerPhone || merged.accountPhone,
        }).eq("id", auth.id);
      }

      if (sellerIdRef.current) {
        const { error } = await supabase.from("sellers").update(payload).eq("id", sellerIdRef.current);
        if (error) throw error;
      } else {
        // Only create the row once we actually have a shop name to build an id/slug from (Step 3+).
        if (!merged.shopName.trim()) return { error: null };
        const slug = `${slugify(merged.shopName)}-${auth.id.slice(0, 6)}`;
        const { data, error } = await supabase.from("sellers").insert({
          id: slug,
          owner_id: auth.id,
          slug,
          status: "draft",
          ...payload,
        }).select("id").single();
        if (error) throw error;
        setSellerId(data.id);
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Unable to save your progress." };
    }
  }, [auth, form]);

  const addProduct = useCallback(async (input: { name: string; category: string; subcategory: string; price: number; unit: string; stock: number; available: boolean; imageUrl?: string }) => {
    if (!sellerIdRef.current) return { error: "Save your shop details first." };
    const supabase = getSupabaseBrowserClient();
    const id = `${sellerIdRef.current}-${slugify(input.name)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from("products").insert({
      id,
      seller_id: sellerIdRef.current,
      seller_name: form.shopName,
      seller_slug: sellerIdRef.current,
      name: input.name,
      category: input.category,
      category_slug: slugify(input.subcategory || input.category),
      price: input.price,
      original_price: input.price,
      unit: input.unit,
      stock_quantity: input.stock,
      is_available: input.available,
      image_url: input.imageUrl || "",
    }).select("*").single();
    if (error) return { error: error.message };
    setProducts((current) => [...current, data as ProductRow]);
    return { error: null };
  }, [form.shopName]);

  const updateProduct = useCallback(async (id: string, patch: Partial<Pick<ProductRow, "name" | "category" | "price" | "unit" | "stock_quantity" | "is_available" | "image_url">>) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return { error: error.message };
    setProducts((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    return { error: null };
  }, []);

  const removeProduct = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: error.message };
    setProducts((current) => current.filter((p) => p.id !== id));
    return { error: null };
  }, []);

  const submitApplication = useCallback(async (): Promise<{ error: string | null }> => {
    if (!sellerIdRef.current || auth.status !== "signed-in") return { error: "Please complete the earlier steps first." };
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("sellers").update({ status: "pending", onboarding_step: 7 }).eq("id", sellerIdRef.current);
    if (error) return { error: error.message };
    await supabase.from("profiles").update({ role: "seller" }).eq("id", auth.id);
    return { error: null };
  }, [auth]);

  return {
    auth,
    form,
    updateForm,
    toggleCategory,
    step,
    setStep,
    sellerId,
    existingStatus,
    products,
    resumed,
    loadingDraft,
    draftError,
    reloadDraft: loadDraft,
    persistDraft,
    addProduct,
    updateProduct,
    removeProduct,
    submitApplication,
  };
}
