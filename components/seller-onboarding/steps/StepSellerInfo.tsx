"use client";

import { TextField, SelectField } from "@/components/seller-onboarding/FormField";
import { BUSINESS_TYPES } from "@/components/seller-onboarding/constants";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  updateForm: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: FieldErrors;
}

export default function StepSellerInfo({ form, updateForm, errors }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField label="Seller / Owner Name" required value={form.ownerName} onChange={(v) => updateForm("ownerName", v)} placeholder="e.g. Jane Wanjiru" error={errors.ownerName} />
      <TextField label="Phone Number" required value={form.sellerPhone} onChange={(v) => updateForm("sellerPhone", v)} placeholder="0712 345 678" type="tel" error={errors.sellerPhone} />
      <TextField label="Email" required value={form.sellerEmail} onChange={(v) => updateForm("sellerEmail", v)} placeholder="you@example.com" type="email" error={errors.sellerEmail} />
      <SelectField
        label="Business Type"
        required
        value={form.businessType}
        onChange={(v) => updateForm("businessType", v)}
        options={BUSINESS_TYPES}
        error={errors.businessType}
      />
      <TextField
        label="Business Registration Number"
        value={form.businessRegNumber}
        onChange={(v) => updateForm("businessRegNumber", v)}
        placeholder="Optional"
        hint="Optional — leave blank if you don't have one yet."
        className="sm:col-span-2"
      />
    </div>
  );
}
