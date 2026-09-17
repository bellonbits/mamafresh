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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(new URLSearchParams(window.location.search).get("next") || "/home");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" description="Sign in to continue shopping fresh with MamaFresh." footer={<><span className="text-xs text-gray-500">New to MamaFresh? </span><Link href="/register" className="text-xs font-bold text-[#789d53] hover:underline">Create account</Link></>}>
          <div className="mb-6 flex items-center justify-center gap-3">
            <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-50" aria-label="Apple Login"><AppleIcon /></button>
              <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Google Login"><GoogleIcon /></button>
            <button type="button" onClick={() => router.push("/home")} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Facebook Login"><FacebookIcon /></button>
          </div>
          <div className="relative mb-6 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><span className="relative bg-white px-3 text-[10px] text-gray-400">or</span></div>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{error}</p>}
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Username or Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-medium text-gray-500">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-medium text-[#789d53] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-gray-200 px-0 py-2 pr-10 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mx-auto mt-4 block w-36 rounded-full bg-[#6f6f6f] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#073729] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
    </AuthShell>
  );
}
