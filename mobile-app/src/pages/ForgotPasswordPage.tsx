
import { useState } from "react";
import Link from "@/lib/next-compat/link";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      description="We'll email you a link to set a new password."
      footer={<><span className="text-xs text-gray-500">Remembered it? </span><Link href="/login" className="text-xs font-bold text-[#789d53] hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs text-emerald-700">
          If an account exists for <strong>{email}</strong>, a password reset link is on its way. Check your inbox (and spam folder).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{error}</p>}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mx-auto mt-4 block w-40 rounded-full bg-[#6f6f6f] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#073729] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
