"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, CheckCircle2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import type { AdminRole } from "@/lib/supabase/types";

interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  admin_role: AdminRole | null;
}

const ROLE_OPTIONS: { value: AdminRole; label: string; note: string }[] = [
  { value: "super_admin", label: "Super Admin", note: "Full access to everything" },
  { value: "marketplace_manager", label: "Marketplace Manager", note: "Sellers, shops, products, categories" },
  { value: "support_agent", label: "Support Agent", note: "Customers, orders, complaints" },
  { value: "finance_admin", label: "Finance Admin", note: "Payments, commissions, payouts, refunds" },
  { value: "content_manager", label: "Content Manager", note: "Reviews, promotions, notifications" },
];

export default function AdminUsersPage() {
  const { adminRole: myRole } = useIsAdmin();
  const canManage = myRole === "super_admin";

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AdminProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabaseBrowserClient().from("profiles").select("id, full_name, phone, admin_role").eq("role", "admin").order("full_name");
    setAdmins((data ?? []) as AdminProfile[]);
    setLoading(false);
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const setRole = async (id: string, role: AdminRole) => {
    const { error } = await getSupabaseBrowserClient().from("profiles").update({ admin_role: role }).eq("id", id);
    if (error) { notify(error.message); return; }
    setAdmins((current) => current.map((a) => (a.id === id ? { ...a, admin_role: role } : a)));
    notify("Admin role updated.");
  };

  const runSearch = async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await getSupabaseBrowserClient()
      .from("profiles")
      .select("id, full_name, phone, admin_role")
      .neq("role", "admin")
      .or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`)
      .limit(8);
    setSearchResults((data ?? []) as AdminProfile[]);
    setSearching(false);
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await getSupabaseBrowserClient().from("profiles").update({ role: "admin" }).eq("id", userId);
    if (error) { notify(error.message); return; }
    notify("Promoted to admin — assign a role below.");
    setSearchResults((current) => current.filter((u) => u.id !== userId));
    void load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Users</h1>
        <p className="text-xs text-gray-500">{canManage ? "As a Super Admin, you control who has access to what" : "Only a Super Admin can change roles"}</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B6E2BA] bg-[#DCFCE7] p-3 text-xs font-bold text-[#15803d] animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {canManage && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-2 text-xs font-black text-gray-700">Promote a user to admin</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void runSearch()} placeholder="Search by name or phone..." className="w-full rounded-full border border-gray-200 bg-[#F6F7F9] py-2 pl-8 pr-3 text-xs outline-none focus:border-[#16A34A]" />
            </div>
            <button onClick={() => void runSearch()} disabled={searching} className="rounded-full bg-[#073729] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">Search</button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-700">{u.full_name || "Unnamed"} · {u.phone || "No phone"}</span>
                  <button onClick={() => void promoteToAdmin(u.id)} className="flex items-center gap-1 rounded-full bg-[#073729] px-2.5 py-1 text-[10px] font-bold text-white"><UserPlus size={11} /> Make admin</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <p className="p-8 text-center text-xs font-bold text-gray-400">Loading...</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#16A34A]"><ShieldCheck size={16} /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.full_name || "Unnamed admin"}</p>
                    <p className="text-xs text-gray-400">{a.phone || "No phone"}</p>
                  </div>
                </div>
                {canManage ? (
                  <select value={a.admin_role ?? ""} onChange={(e) => void setRole(a.id, e.target.value as AdminRole)} className="rounded-xl border border-gray-200 p-2 text-xs font-semibold">
                    <option value="" disabled>No role assigned</option>
                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                ) : (
                  <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", a.admin_role ? "bg-[#DCFCE7] text-[#15803d]" : "bg-gray-100 text-gray-500")}>
                    {ROLE_OPTIONS.find((r) => r.value === a.admin_role)?.label ?? "No role assigned"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="mb-2 text-xs font-black text-gray-700">What each role can do</p>
        <div className="space-y-1.5">
          {ROLE_OPTIONS.map((r) => (
            <div key={r.value} className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">{r.label}</span>
              <span className="text-gray-400">{r.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
