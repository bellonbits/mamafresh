"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Store, RefreshCw } from "lucide-react";
import { useSellerOnboarding } from "@/lib/hooks/useSellerOnboarding";
import OnboardingProgress, { type StepDef } from "@/components/seller-onboarding/OnboardingProgress";
import StepAccount from "@/components/seller-onboarding/steps/StepAccount";
import StepSellerInfo from "@/components/seller-onboarding/steps/StepSellerInfo";
import StepShopInfo from "@/components/seller-onboarding/steps/StepShopInfo";
import StepLocation from "@/components/seller-onboarding/steps/StepLocation";
import StepCategories from "@/components/seller-onboarding/steps/StepCategories";
import StepProducts from "@/components/seller-onboarding/steps/StepProducts";
import StepReview from "@/components/seller-onboarding/steps/StepReview";
import SuccessScreen from "@/components/seller-onboarding/SuccessScreen";
import {
  validateAccountStep,
  validateSellerInfoStep,
  validateShopInfoStep,
  validateLocationStep,
  validateCategoriesStep,
  collectReviewIssues,
  type FieldErrors,
} from "@/components/seller-onboarding/validation";

const STEPS: StepDef[] = [
  { number: 1, label: "Account" },
  { number: 2, label: "Seller Information" },
  { number: 3, label: "Shop Information" },
  { number: 4, label: "Location" },
  { number: 5, label: "Shop Categories" },
  { number: 6, label: "Products" },
  { number: 7, label: "Review & Submit" },
];

export default function SellerOnboardingPage() {
  const {
    auth, form, updateForm, toggleCategory, step, setStep, sellerId, existingStatus,
    products, loadingDraft, draftError, reloadDraft, persistDraft,
    addProduct, updateProduct, removeProduct, submitApplication,
  } = useSellerOnboarding();

  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // By the review step the seller is already authenticated (step 1 can't be
  // passed otherwise), and the password field is only ever used transiently
  // during signup — it's never persisted back, so checking it here would
  // always fail. isNewAccount is false for the same reason handleContinue's
  // own step-1 validation below already passes false.
  const reviewIssues = useMemo(() => collectReviewIssues(form, products, false), [form, products]);

  const goTo = (target: number) => {
    setErrors({});
    setSaveError(null);
    setStep(target);
  };

  const handleContinue = async () => {
    let stepErrors: FieldErrors = {};
    if (step === 1) stepErrors = validateAccountStep(form, false);
    if (step === 2) stepErrors = validateSellerInfoStep(form);
    if (step === 3) stepErrors = validateShopInfoStep(form);
    if (step === 4) stepErrors = validateLocationStep(form);
    if (step === 5) stepErrors = validateCategoriesStep(form);

    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (step >= 1 && step <= 5) {
      setSaving(true);
      setSaveError(null);
      const patch = step === 1 ? { ownerName: form.fullName, sellerPhone: form.accountPhone } : {};
      const { error } = await persistDraft(patch, step + 1);
      setSaving(false);
      if (error) {
        setSaveError(error);
        return;
      }
    }
    setStep((current) => Math.min(current + 1, STEPS.length));
  };

  const handleSubmit = async () => {
    const issues = collectReviewIssues(form, products, false).filter((i) => i.step !== 6);
    if (issues.length > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await submitApplication();
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitted(true);
  };

  if (loadingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f3] text-sm font-bold text-gray-400">
        Loading...
      </div>
    );
  }

  if (draftError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f3f4f3] p-6 text-center">
        <p className="text-sm font-bold text-red-600">{draftError}</p>
        <button onClick={() => void reloadDraft()} className="flex items-center gap-1.5 rounded-full bg-[#073729] px-5 py-2.5 text-xs font-bold text-white"><RefreshCw size={13} /> Try Again</button>
      </div>
    );
  }

  if (existingStatus && existingStatus !== "draft") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f3f4f3] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f5e7] text-[#16A34A]"><Store size={24} /></div>
        <p className="text-lg font-black text-gray-900">You already have a MamaFresh shop</p>
        <p className="max-w-sm text-sm text-gray-500">
          {existingStatus === "pending" && "Your application is still pending review."}
          {existingStatus === "approved" && "Your shop is live and approved."}
          {existingStatus === "suspended" && "Your shop is currently suspended. Contact support for help."}
          {existingStatus === "rejected" && "Your previous application was not approved. Contact support to discuss next steps."}
        </p>
        <Link href="/seller" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Go to Seller Dashboard</Link>
      </div>
    );
  }

  const genericContinueVisible = step !== 1 || auth.status === "signed-in";

  return (
    <div className="min-h-screen bg-[#f3f4f3]">
      <header className="border-b border-emerald-100 bg-white">
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/home" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="MamaFresh" width={180} height={72} className="h-16 w-36 object-contain object-left" priority />
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
            <Link href="/home" className="hidden hover:text-[#16A34A] sm:block">Marketplace</Link>
            <Link href="/help" className="hover:text-[#16A34A]">Seller help</Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(7,55,41,0.16)] lg:grid lg:max-w-5xl lg:min-h-[650px] lg:grid-cols-[300px_1fr]">
          <aside className="bg-[#073729] px-5 py-6 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <Link href="/home" aria-label="MamaFresh home" className="hidden h-8 w-8 items-center justify-center rounded-lg bg-[#84CC16] text-[#073729] lg:flex"><Store size={17} /></Link>
            <p className="hidden lg:mt-10 lg:block lg:text-sm lg:leading-6 lg:text-white/75">Register your MamaFresh shop in a few guided steps.</p>
            <div className="lg:mt-8">
              <OnboardingProgress steps={STEPS} currentStep={step} onJump={submitted ? undefined : goTo} />
            </div>
          </aside>

          <main className="relative flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
            {!submitted && step > 1 && (
              <button type="button" onClick={() => goTo(step - 1)} aria-label="Go back" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#073729] sm:left-6 sm:top-6">
                <ArrowLeft size={18} />
              </button>
            )}

            {submitted ? (
              <SuccessScreen shopName={form.shopName} />
            ) : (
              <div className="mx-auto w-full max-w-2xl space-y-4 px-4 sm:space-y-5 sm:px-0">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#16A34A] text-white sm:h-12 sm:w-12"><Store size={20} /></div>
                <h1 className="text-xl font-black text-[#171717] sm:text-2xl">{STEPS[step - 1].label}</h1>

                {step === 1 && <StepAccount auth={auth} form={form} updateForm={updateForm} errors={errors} onAuthenticated={() => { setErrors({}); void reloadDraft(); setStep(2); }} />}
                {step === 2 && <StepSellerInfo form={form} updateForm={updateForm} errors={errors} />}
                {step === 3 && auth.status === "signed-in" && <StepShopInfo form={form} updateForm={updateForm} errors={errors} ownerId={auth.id} />}
                {step === 4 && <StepLocation form={form} updateForm={updateForm} errors={errors} />}
                {step === 5 && <StepCategories form={form} toggleCategory={toggleCategory} errors={errors} />}
                {step === 6 && <StepProducts products={products} onAdd={addProduct} onUpdate={updateProduct} onRemove={removeProduct} canAddProducts={!!sellerId} />}
                {step === 7 && <StepReview form={form} products={products} issues={reviewIssues} onEditStep={goTo} submitError={submitError} />}

                {saveError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{saveError}</p>}

                {genericContinueVisible && (
                  <div className="flex justify-end gap-3 pt-2">
                    {step < STEPS.length ? (
                      <button
                        type="button"
                        onClick={() => void handleContinue()}
                        disabled={saving}
                        className="min-h-11 w-full rounded-full bg-[#073729] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#16A34A] disabled:opacity-60 sm:w-auto sm:px-8"
                      >
                        {saving ? "Saving..." : "Continue"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                        className="min-h-11 w-full rounded-full bg-[#073729] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#16A34A] disabled:opacity-60 sm:w-auto sm:px-8"
                      >
                        {submitting ? "Submitting..." : "Submit Seller Application"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
