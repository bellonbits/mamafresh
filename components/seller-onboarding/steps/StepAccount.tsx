"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { TextField } from "@/components/seller-onboarding/FormField";
import type { OnboardingForm, AuthState } from "@/lib/hooks/useSellerOnboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FieldErrors } from "@/components/seller-onboarding/validation";

interface Props {
  auth: AuthState;
  form: OnboardingForm;
  updateForm: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: FieldErrors;
  onAuthenticated: () => void;
}

export default function StepAccount({ auth, form, updateForm, errors, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (auth.status === "signed-in") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>You&apos;re signed in as {auth.email}. We&apos;ll use this account for your shop.</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full Name" required value={form.fullName} onChange={(v) => updateForm("fullName", v)} placeholder="Your full name" error={errors.fullName} />
          <TextField label="Phone Number" required value={form.accountPhone} onChange={(v) => updateForm("accountPhone", v)} placeholder="0712 345 678" type="tel" error={errors.accountPhone} />
          <TextField label="Email" required value={form.accountEmail} onChange={(v) => updateForm("accountEmail", v)} placeholder="you@example.com" type="email" disabled />
        </div>
      </div>
    );
  }

  const handleAuth = async () => {
    setSubmitting(true);
    setAuthError(null);
    const supabase = getSupabaseBrowserClient();
    try {
      if (mode === "signup") {
        if (!form.password || form.password.length < 8) {
          setAuthError("Password must be at least 8 characters.");
          setSubmitting(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: form.accountEmail,
          password: form.password,
          options: { data: { full_name: form.fullName, phone: form.accountPhone } },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthError("Check your email to confirm your account, then come back and sign in here.");
          setSubmitting(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.accountEmail, password: form.password });
        if (error) throw error;
      }
      onAuthenticated();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to continue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 text-xs font-bold">
        <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-lg py-2 transition-colors ${mode === "signup" ? "bg-white text-[#073729] shadow-xs" : "text-gray-500"}`}>Create account</button>
        <button type="button" onClick={() => setMode("signin")} className={`flex-1 rounded-lg py-2 transition-colors ${mode === "signin" ? "bg-white text-[#073729] shadow-xs" : "text-gray-500"}`}>I already have an account</button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {mode === "signup" && (
          <TextField label="Full Name" required value={form.fullName} onChange={(v) => updateForm("fullName", v)} placeholder="Your full name" error={errors.fullName} className="sm:col-span-2" />
        )}
        <TextField label="Email" required value={form.accountEmail} onChange={(v) => updateForm("accountEmail", v)} placeholder="you@example.com" type="email" error={errors.accountEmail} />
        {mode === "signup" && (
          <TextField label="Phone Number" required value={form.accountPhone} onChange={(v) => updateForm("accountPhone", v)} placeholder="0712 345 678" type="tel" error={errors.accountPhone} />
        )}
        <TextField label="Password" required value={form.password} onChange={(v) => updateForm("password", v)} placeholder="At least 8 characters" type="password" error={errors.password} hint={mode === "signup" ? "You'll use this to log in and manage your shop later." : undefined} className={mode === "signin" ? "sm:col-span-2" : undefined} />
      </div>

      {authError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{authError}</p>}

      <button
        type="button"
        onClick={() => void handleAuth()}
        disabled={submitting}
        className="min-h-11 w-full rounded-full bg-[#073729] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0B3D2E] disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {submitting ? "Please wait..." : mode === "signup" ? "Create account & continue" : "Sign in & continue"}
      </button>

      <p className="text-[11px] text-gray-400">
        By continuing you agree to MamaFresh&apos;s seller terms. Need help? <Link href="/help" className="font-semibold text-[#16A34A]">Visit Seller Help</Link>.
      </p>
    </div>
  );
}
