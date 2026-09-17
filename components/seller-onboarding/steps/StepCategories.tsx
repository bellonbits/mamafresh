"use client";

import ChipMultiSelect from "@/components/seller-onboarding/ChipMultiSelect";
import { CATEGORIES } from "@/lib/mock-data";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  toggleCategory: (value: string) => void;
  errors: FieldErrors;
}

const CATEGORY_ITEMS = CATEGORIES.map((c) => ({ value: c.slug, label: c.name }));

export default function StepCategories({ form, toggleCategory, errors }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Select every category of produce your shop sells. At least one is required.</p>
      <ChipMultiSelect items={CATEGORY_ITEMS} selected={form.categories} onToggle={toggleCategory} />
      {errors.categories && <p className="text-[11px] font-semibold text-red-600">{errors.categories}</p>}
    </div>
  );
}
