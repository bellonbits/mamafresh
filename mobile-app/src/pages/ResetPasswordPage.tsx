
import { useEffect, useState } from "react";
import Link from "@/lib/next-compat/link";
import { useRouter } from "@/lib/next-compat/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setSessionValid(true);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setSessionValid(true);
      setReady(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your MamaFresh account."
      footer={<><span className="text-xs text-gray-500">Changed your mind? </span><Link href="/login" className="text-xs font-bold text-[#789d53] hover:underline">Back to sign in</Link></>}
    >
      {!ready ? (
        <p className="text-center text-xs text-gray-400">Checking your reset link...</p>
      ) : !sessionValid ? (
        <div className="rounded-xl bg-rose-50 p-4 text-center text-xs text-rose-600">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-bold underline">Request a new one</Link>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600">{error}</p>}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-0 border-b border-gray-200 px-0 py-2 pr-10 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">Confirm new password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full border-0 border-b border-gray-200 px-0 py-2 text-sm text-gray-800 outline-none focus:border-[#789d53] focus:ring-0"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mx-auto mt-4 block w-40 rounded-full bg-[#6f6f6f] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#073729] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save new password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
