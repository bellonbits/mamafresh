"use client";

import { TextField, TextAreaField, SelectField } from "@/components/seller-onboarding/FormField";
import ImageUpload from "@/components/seller-onboarding/ImageUpload";
import { CATEGORIES } from "@/lib/mock-data";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  updateForm: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: FieldErrors;
  ownerId: string;
}

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.slug, label: c.name }));

export default function StepShopInfo({ form, updateForm, errors, ownerId }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Shop Name" required value={form.shopName} onChange={(v) => updateForm("shopName", v)} placeholder="GreenBasket Fresh Produce" error={errors.shopName} className="sm:col-span-2" />
        <SelectField label="Shop Category" required value={form.primaryCategory} onChange={(v) => updateForm("primaryCategory", v)} options={CATEGORY_OPTIONS} error={errors.primaryCategory} hint="Your main product category — you can pick more later." />
        <TextField label="Shop Phone" value={form.shopPhone} onChange={(v) => updateForm("shopPhone", v)} placeholder="0712 345 678" type="tel" error={errors.shopPhone} />
        <TextField label="Shop WhatsApp" value={form.shopWhatsapp} onChange={(v) => updateForm("shopWhatsapp", v)} placeholder="0712 345 678" type="tel" error={errors.shopWhatsapp} />
        <TextAreaField label="Shop Description" value={form.shopDescription} onChange={(v) => updateForm("shopDescription", v)} placeholder="Fresh vegetables, fruits and groceries available in Kasarani." className="sm:col-span-2" />
      </div>

      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
        <ImageUpload label="Logo" value={form.logoUrl} onChange={(v) => updateForm("logoUrl", v)} ownerId={ownerId} aspect="square" />
        <ImageUpload label="Banner" value={form.bannerUrl} onChange={(v) => updateForm("bannerUrl", v)} ownerId={ownerId} aspect="wide" />
      </div>
      <p className="text-[11px] text-gray-400">Logo and banner are optional — you can add them anytime from your shop settings.</p>
    </div>
  );
}
