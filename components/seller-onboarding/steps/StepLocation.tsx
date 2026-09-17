"use client";

import { TextField, TextAreaField, SelectField } from "@/components/seller-onboarding/FormField";
import { SELLER_AREAS, COUNTIES } from "@/components/seller-onboarding/constants";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  updateForm: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: FieldErrors;
}

export default function StepLocation({ form, updateForm, errors }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField label="Area / Estate" required value={form.area} onChange={(v) => updateForm("area", v)} options={SELLER_AREAS} error={errors.area} />
      {form.area === "__other__" && (
        <TextField label="Your Area" required value={form.areaOther} onChange={(v) => updateForm("areaOther", v)} placeholder="e.g. Ruaraka" error={errors.areaOther} />
      )}
      <SelectField label="County" required value={form.county} onChange={(v) => updateForm("county", v)} options={COUNTIES} error={errors.county} />
      <TextField label="Sub-county" value={form.subCounty} onChange={(v) => updateForm("subCounty", v)} placeholder="e.g. Kasarani" />
      <TextField label="Street / Building" value={form.street} onChange={(v) => updateForm("street", v)} placeholder="e.g. Seasons Stage, Stall 14" />
      <TextField label="Landmark" value={form.landmark} onChange={(v) => updateForm("landmark", v)} placeholder="Near Kasarani Mall" />
      <TextAreaField label="Location description" value={form.locationNotes} onChange={(v) => updateForm("locationNotes", v)} placeholder="Any extra directions for riders or customers." className="sm:col-span-2" rows={2} />
    </div>
  );
}
