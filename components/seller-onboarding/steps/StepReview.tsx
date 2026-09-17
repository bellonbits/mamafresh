"use client";

import { Pencil, AlertCircle } from "lucide-react";
import { CATEGORIES } from "@/lib/mock-data";
import { BUSINESS_TYPES, SELLER_AREAS } from "@/components/seller-onboarding/constants";
import { formatKSh } from "@/lib/utils";
import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { ProductRow } from "@/lib/supabase/types";
import type { ReviewIssue } from "@/components/seller-onboarding/validation";

interface Props {
  form: OnboardingForm;
  products: ProductRow[];
  issues: ReviewIssue[];
  onEditStep: (step: number) => void;
  submitError: string | null;
}

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-[#F8FAF9] p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide text-[#073729]">{title}</p>
        <button type="button" onClick={() => onEdit(step)} className="flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"><Pencil size={12} /> Edit</button>
      </div>
      <div className="space-y-1 text-sm text-gray-700">{children}</div>
    </div>
  );
}

export default function StepReview({ form, products, issues, onEditStep, submitError }: Props) {
  const categoryLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
  const businessTypeLabel = BUSINESS_TYPES.find((b) => b.value === form.businessType)?.label ?? "—";
  const areaLabel = form.area === "__other__" ? form.areaOther : (SELLER_AREAS.find((a) => a.value === form.area)?.label ?? "—");
  const blockingIssues = issues.filter((i) => i.step !== 6);
  const softIssues = issues.filter((i) => i.step === 6);

  return (
    <div className="space-y-4">
      {issues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
          <p className="flex items-center gap-1.5 font-bold"><AlertCircle size={14} /> Please complete:</p>
          <ul className="mt-1.5 space-y-1">
            {[...blockingIssues, ...softIssues].map((issue) => (
              <li key={`${issue.step}-${issue.label}`}>
                <button type="button" onClick={() => onEditStep(issue.step)} className="font-semibold underline hover:text-amber-900">
                  {issue.label}
                </button>
                {issue.step === 6 && " (optional, but recommended)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{submitError}</p>}

      <Section title="Account" step={1} onEdit={onEditStep}>
        <p><strong>Name:</strong> {form.fullName || "—"}</p>
        <p><strong>Phone:</strong> {form.accountPhone || "—"}</p>
        <p><strong>Email:</strong> {form.accountEmail || "—"}</p>
      </Section>

      <Section title="Seller" step={2} onEdit={onEditStep}>
        <p><strong>Business type:</strong> {businessTypeLabel}</p>
        {form.businessRegNumber && <p><strong>Registration number:</strong> {form.businessRegNumber}</p>}
      </Section>

      <Section title="Shop" step={3} onEdit={onEditStep}>
        <p><strong>Shop name:</strong> {form.shopName || "—"}</p>
        {form.shopDescription && <p><strong>Description:</strong> {form.shopDescription}</p>}
        <p><strong>Category:</strong> {form.primaryCategory ? categoryLabel(form.primaryCategory) : "—"}</p>
        {(form.logoUrl || form.bannerUrl) && <p><strong>Images:</strong> {[form.logoUrl && "Logo", form.bannerUrl && "Banner"].filter(Boolean).join(", ")} uploaded</p>}
      </Section>

      <Section title="Location" step={4} onEdit={onEditStep}>
        <p><strong>Area:</strong> {areaLabel}</p>
        <p><strong>County:</strong> {form.county || "—"}</p>
        {form.street && <p><strong>Street/Building:</strong> {form.street}</p>}
        {form.landmark && <p><strong>Landmark:</strong> {form.landmark}</p>}
      </Section>

      <Section title="Categories" step={5} onEdit={onEditStep}>
        {form.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {form.categories.map((slug) => (
              <span key={slug} className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-bold text-[#15803d]">{categoryLabel(slug)}</span>
            ))}
          </div>
        ) : <p>—</p>}
      </Section>

      <Section title="Products" step={6} onEdit={onEditStep}>
        {products.length === 0 ? <p>No products added yet.</p> : (
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.id}>{p.name} — {formatKSh(p.price)} / {p.unit}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
