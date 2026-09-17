"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import AppleIcon from "@/components/AppleIcon";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await getSupabaseBrowserClient().auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) throw signUpError;
      if (data.session) router.push("/home");
      else setError("Account created. Check your email to confirm it before signing in.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create an account" description="Join MamaFresh and discover fresh food from local sellers." footer={<><span className="text-xs text-gray-500">Already have an account? </span><Link href="/login" className="text-xs font-bold text-[#789d53] hover:underline">Sign in</Link></>}>
      <div className="mb-6 flex items-center justify-center gap-3">
        <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-50" aria-label="Apple Sign Up"><AppleIcon /></button>
          <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Google Sign Up"><GoogleIcon /></button>
        <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Facebook Sign Up"><FacebookIcon /></button>
      </div>
      <div className="relative mb-6 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><span className="relative bg-white px-3 text-[10px] text-gray-400">or</span></div>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{error}</p>}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Full name</label>
          <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Email</label>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full border-0 border-b border-gray-200 px-0 py-2 pr-10 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        <label className="flex items-center gap-2 pt-1 text-[10px] text-gray-500"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-[#789d53] focus:ring-[#789d53]" />I agree to the <span className="font-semibold text-[#073729]">Terms & Conditions</span></label>
        <button type="submit" disabled={loading || !agreed} className="mx-auto mt-4 block w-36 rounded-full bg-[#6f6f6f] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#073729] disabled:opacity-60">{loading ? "Creating account..." : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
