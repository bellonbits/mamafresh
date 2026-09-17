"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Star,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { cn, formatKSh } from "@/lib/utils";
import { LOCATIONS } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadAvatarImage } from "@/lib/cloudinary/upload";
import { useCartStore } from "@/lib/store/cart";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useRouter } from "next/navigation";
import type { OrderRow, OrderItemRow, ReviewRow, ProductRow } from "@/lib/supabase/types";

// Customer Navigation Tabs matching the wanted features
const customerNavItems = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "addresses", label: "Saved Addresses", icon: MapPin },
  { id: "favorites", label: "My Favorites", icon: Heart },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "reviews", label: "My Reviews", icon: Star },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

type OrderWithItems = OrderRow & { order_items: OrderItemRow[]; sellers: { name: string } | null };
type ReviewWithProduct = ReviewRow & { products: { name: string } | null };

export default function AccountPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("Tuesday, 15 September");

  // Notifications drawer
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Profile state
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "MamaFresh Customer",
    location: "Kasarani, Nairobi",
    avatarUrl: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(profile);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 2. Orders state
  const [orders, setOrders] = useState<OrderWithItems[]>([]);

  // 3. Saved Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>({
    label: "Home",
    address: "",
    isDefault: false,
  });

  // 4. Favorites
  const { favoriteIds } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<ProductRow[]>([]);
  const { addItem: addToCart } = useCartStore();

  // 5. Reviews
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [reviewableProducts, setReviewableProducts] = useState<{ id: string; name: string }[]>([]);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [newReview, setNewReview] = useState({ productId: "", stars: 5, comment: "" });

  // 6. Preferences
  const [preferences, setPreferences] = useState({
    language: "English",
    notifications: true,
    location: LOCATIONS[0],
  });

  // 7. Security modal
  const [securityModal, setSecurityModal] = useState<string | null>(null);

  // 8. Logout modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setProfileLoading(false);
        return;
      }
      setUserId(user.id);

      const [{ data: profileRow }, { data: orderRows }, { data: addressRows }, { data: reviewRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("orders").select("*, order_items(*), sellers(name)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(6),
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
        supabase.from("reviews").select("*, products(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (!active) return;

      setProfile({
        name: profileRow?.full_name || user.email?.split("@")[0] || "MamaFresh customer",
        email: user.email ?? "",
        phone: profileRow?.phone ?? "",
        role: "MamaFresh Customer",
        location: "Kasarani, Nairobi",
        avatarUrl: profileRow?.avatar_url ?? "",
      });
      setOrders((orderRows ?? []) as unknown as OrderWithItems[]);
      setAddresses((addressRows ?? []).map((a) => ({ id: a.id, label: a.label, address: a.address, isDefault: a.is_default })));
      setReviews((reviewRows ?? []) as unknown as ReviewWithProduct[]);

      const productIds = Array.from(new Set(
        (orderRows ?? []).flatMap((o) => (o as unknown as OrderWithItems).order_items.map((i) => i.product_id))
      ));
      if (productIds.length > 0) {
        const { data: products } = await supabase.from("products").select("id,name").in("id", productIds);
        if (active) setReviewableProducts((products ?? []) as { id: string; name: string }[]);
      }
      setProfileLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const ids = Array.from(favoriteIds);
    const load = async () => {
      if (ids.length === 0) {
        if (active) setFavoriteProducts([]);
        return;
      }
      const { data } = await getSupabaseBrowserClient().from("products").select("*").in("id", ids).limit(6);
      if (active) setFavoriteProducts((data ?? []) as ProductRow[]);
    };
    void load();
    return () => { active = false; };
  }, [favoriteIds]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const now = new Date();
        const formatted = now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        setCurrentDate(formatted);
      } catch {
        setCurrentDate("Tuesday, 15 September");
      }
    });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("profiles").update({ full_name: profileForm.name, phone: profileForm.phone }).eq("id", userId);
    if (error) {
      triggerToast(error.message);
      return;
    }
    if (profileForm.email && profileForm.email !== profile.email) {
      await supabase.auth.updateUser({ email: profileForm.email });
    }
    setProfile(profileForm);
    setEditProfileOpen(false);
    triggerToast("Profile updated successfully!");
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB.");
      return;
    }
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const url = await uploadAvatarImage(file);
      const { error } = await getSupabaseBrowserClient().from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (error) throw error;
      setProfile((current) => ({ ...current, avatarUrl: url }));
      setProfileForm((current) => ({ ...current, avatarUrl: url }));
      triggerToast("Profile photo updated!");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();

    if (addressForm.isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }

    if (editingAddressId) {
      const { error } = await supabase.from("addresses").update({
        label: addressForm.label,
        address: addressForm.address,
        is_default: addressForm.isDefault,
      }).eq("id", editingAddressId);
      if (error) { triggerToast(error.message); return; }
      setAddresses((prev) => prev.map((addr) => addr.id === editingAddressId ? { ...addressForm, id: editingAddressId } : (addressForm.isDefault ? { ...addr, isDefault: false } : addr)));
      triggerToast("Address updated!");
    } else {
      const { data, error } = await supabase.from("addresses").insert({
        user_id: userId,
        label: addressForm.label,
        address: addressForm.address,
        is_default: addressForm.isDefault,
      }).select("*").single();
      if (error || !data) { triggerToast(error?.message ?? "Unable to save address."); return; }
      setAddresses((prev) => [
        { id: data.id, label: data.label, address: data.address, isDefault: data.is_default },
        ...(addressForm.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev),
      ]);
      triggerToast("New address added!");
    }
    setAddressModalOpen(false);
    setEditingAddressId(null);
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await getSupabaseBrowserClient().from("addresses").delete().eq("id", id);
    if (error) { triggerToast(error.message); return; }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    triggerToast("Address removed");
  };

  const handleReorder = async (order: OrderWithItems) => {
    const supabase = getSupabaseBrowserClient();
    const productIds = order.order_items.map((i) => i.product_id);
    const { data: products } = await supabase.from("products").select("*").in("id", productIds);
    const rows = (products ?? []) as ProductRow[];
    let added = 0;
    for (const item of order.order_items) {
      const product = rows.find((p) => p.id === item.product_id);
      if (product && product.is_available) {
        addToCart(product, item.quantity);
        added += 1;
      }
    }
    triggerToast(added > 0 ? `${added} item(s) added to your cart!` : "Those items are no longer available.");
  };

  const getStatusBadge = (status: OrderRow["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ready":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "accepted":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const navBadges: Record<string, number> = {
    orders: orders.length,
    addresses: addresses.length,
    favorites: favoriteIds.size,
    reviews: reviews.length,
    notifications: activeOrders.length,
  };

  // Scroll to section or set active tab
  const handleNavClick = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 p-3 sm:p-5 lg:p-7 antialiased font-sans">
      {/* Desktop Dashboard Canvas */}
      <div className="max-w-[1440px] mx-auto bg-transparent flex flex-col lg:flex-row gap-5 lg:gap-6 items-start relative">

        {/* ══════════════════════════════════════════════════════════════
            LEFT SIDEBAR (With Logo replacing "grocery" & Customer Tabs)
        ══════════════════════════════════════════════════════════════ */}
        <aside
          className={cn(
            "bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-300 relative z-20 w-full lg:min-h-[920px]",
            sidebarCollapsed ? "lg:w-20" : "lg:w-[270px]"
          )}
        >
          {/* Collapse toggle button on right edge */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3.5 top-14 w-7 h-7 bg-white rounded-full border border-slate-200 shadow-sm items-center justify-center text-slate-500 hover:text-[#073729] hover:border-[#073729] transition-all z-30 cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={15}
              className={cn("transition-transform duration-300", sidebarCollapsed && "rotate-180")}
            />
          </button>

          <div>
            {/* Logo: Replaced "grocery." with MamaFresh Logo Icon */}
            <div className="flex items-center gap-3 px-2 py-3 mb-4">
              <Link href="/home" className="flex items-center gap-2.5">
                <div className="h-9 w-9 relative flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="MamaFresh Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight text-[#073729] leading-tight">
                      MamaFresh
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E85D04]">
                      Customer Portal
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Customer Navigation Tabs */}
            <nav className="space-y-1">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors group cursor-pointer text-left",
                      isActive
                        ? "bg-emerald-50/90 text-[#073729] font-bold border border-emerald-100/60"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#073729]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={cn(
                          "transition-colors",
                          isActive ? "text-[#073729]" : "text-slate-400 group-hover:text-[#073729]"
                        )}
                      />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && navBadges[item.id] > 0 && (
                      <span className="bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-[#073729] text-[10px] font-black px-2 py-0.5 rounded-full transition-colors">
                        {navBadges[item.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom User Area & Popover */}
          <div className="mt-8 pt-4 relative">
            {/* Popover Mini Menu */}
            {showProfilePopover && !sidebarCollapsed && (
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100 mb-3 animate-fade-in text-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-200 flex-shrink-0 flex items-center justify-center text-xs font-black text-amber-800">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.name} width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                      (profile.name || "M").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-[#073729] truncate">{profile.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <button
                    onClick={() => {
                      handleNavClick("profile");
                      setShowProfilePopover(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors",
                      activeTab === "profile" ? "text-[#E85D04] font-bold" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>My Profile</span>
                    {activeTab === "profile" && <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04]" />}
                  </button>

                  <button
                    onClick={() => {
                      handleNavClick("addresses");
                      setShowProfilePopover(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Saved Addresses
                  </button>

                  <button
                    onClick={() => {
                      handleNavClick("favorites");
                      setShowProfilePopover(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    My Favorites
                  </button>

                  <button
                    onClick={() => {
                      setShowProfilePopover(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}

            {/* Dark Green User Pill Button */}
            <div
              onClick={() => setShowProfilePopover(!showProfilePopover)}
              className={cn(
                "bg-[#073729] hover:bg-[#052b20] text-white rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-sm",
                sidebarCollapsed && "justify-center p-2"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-300 flex-shrink-0 border border-white/20 flex items-center justify-center text-xs font-black text-amber-900">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.name} width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    (profile.name || "M").slice(0, 1).toUpperCase()
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold leading-tight truncate">
                      {profile.name}
                    </p>
                    <p className="text-[10px] text-emerald-200/70 truncate">
                      {profile.phone}
                    </p>
                  </div>
                )}
              </div>

              {!sidebarCollapsed && (
                <button
                  aria-label="Toggle user menu"
                  className="w-6 h-6 rounded-full bg-emerald-800/60 hover:bg-emerald-700 flex items-center justify-center text-emerald-200"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full space-y-6">

          {/* ── TOP HEADER BAR (Dark Emerald Green Container) ── */}
          <header className="bg-[#073729] rounded-2xl px-5 sm:px-7 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm text-white">
            {/* Search Pill */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search orders, shops, produce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#84CC16] placeholder:text-slate-400 font-medium shadow-inner"
              />
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Date & Action Badges */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6">
              <span className="text-xs font-medium text-emerald-100/90 whitespace-nowrap">
                {currentDate}
              </span>

              <div className="flex items-center gap-3">
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-9 h-9 rounded-full bg-white text-[#073729] hover:bg-emerald-50 flex items-center justify-center transition-all shadow-sm relative cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell size={16} />
                    {activeOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#E84919] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                        {activeOrders.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Drawer */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-100 p-3.5 z-40 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-[#073729]">Active orders</p>
                        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-2 mt-2 text-xs">
                        {activeOrders.length === 0 ? (
                          <p className="text-slate-400 py-2 text-center">No active orders right now.</p>
                        ) : activeOrders.map((order) => (
                          <Link key={order.id} href={`/orders/${order.id}`} className="block p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 cursor-pointer">
                            <p className="font-bold text-emerald-700">{order.sellers?.name ?? "Order"} · {order.status.replace(/_/g, " ")}</p>
                            <p className="text-[11px] text-slate-500">#{order.id.slice(0, 8).toUpperCase()} · {formatKSh(order.total)}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ── HEADING & BREADCRUMB ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#073729] tracking-tight">
                My Account
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Manage your profile, orders, addresses, and favorites
              </p>
            </div>
            <Link
              href="/home"
              className="text-xs font-bold text-[#073729] hover:text-emerald-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full transition-colors shadow-2xs"
            >
              ← Back to Shop
            </Link>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARD 1: PROFILE SUMMARY CARD (Peter Gatitu)
          ══════════════════════════════════════════════════════════════ */}
          <section id="profile" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left: Avatar + Customer Details */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative flex-shrink-0">
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatarFile(e.target.files?.[0])} />
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#EAB308] overflow-hidden shadow-sm border border-amber-300/40 flex items-center justify-center text-2xl font-black text-amber-900">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.name} width={96} height={96} className="h-full w-full object-cover" />
                    ) : (
                      (profile.name || "M").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    aria-label="Change profile photo"
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#073729] text-white shadow-md hover:bg-[#0B3D2E] disabled:opacity-60"
                  >
                    <Camera size={13} className={avatarUploading ? "animate-pulse" : ""} />
                  </button>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#073729] leading-tight">
                    {profileLoading ? "Loading..." : profile.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {profile.email}
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    {profile.phone || "No phone on file"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {profile.location} · <span className="text-emerald-600 font-semibold">{profile.role}</span>
                  </p>
                  {avatarError && <p className="mt-1 text-[11px] font-semibold text-red-600">{avatarError}</p>}
                </div>
              </div>

              {/* Edit Profile Button (Orange Accent Button matching user ref) */}
              <button
                onClick={() => {
                  setProfileForm(profile);
                  setEditProfileOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#E85D04] hover:bg-[#D94E00] rounded-lg px-4 py-2 transition-all shadow-sm cursor-pointer"
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 2: 4 QUICK ACTION CARDS (Orders, Favorites, Addresses, Reviews)
          ══════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Orders", count: orders.length, icon: ShoppingBag, targetId: "orders", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Favorites", count: favoriteIds.size, icon: Heart, targetId: "favorites", color: "text-rose-500", bg: "bg-rose-50" },
              { label: "Addresses", count: addresses.length, icon: MapPin, targetId: "addresses", color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Reviews", count: reviews.length, icon: Star, targetId: "reviews", color: "text-amber-500", bg: "bg-amber-50" },
            ].map(({ label, count, icon: Icon, targetId, color, bg }) => (
              <button
                key={label}
                onClick={() => handleNavClick(targetId)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 group-hover:text-[#073729]">
                    {label}
                  </span>
                  <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", bg)}>
                    <Icon size={14} className={color} />
                  </div>
                </div>
                <p className="text-2xl font-black text-[#073729]">{count}</p>
              </button>
            ))}
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 3: MY ORDERS (Recent Orders, Statuses, Reorder)
          ══════════════════════════════════════════════════════════════ */}
          <section id="orders" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#073729]">My Orders</h3>
                <p className="text-xs text-slate-400 font-medium">Recent Orders</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-[#16A34A] hover:text-emerald-700 flex items-center gap-1"
              >
                View all &gt;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {orders.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">No orders yet. <Link href="/home" className="font-bold text-[#16A34A]">Start shopping</Link>.</p>
              )}
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-black text-[#073729]">{order.sellers?.name ?? "MamaFresh seller"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.order_items.length} items · <span className="font-bold text-[#073729]">{formatKSh(order.total)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider",
                          getStatusBadge(order.status)
                        )}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>

                    {order.status === "delivered" && (
                      <button
                        onClick={() => handleReorder(order)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg px-3 py-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 4: SAVED ADDRESSES (Home, Work, + Add New Address)
          ══════════════════════════════════════════════════════════════ */}
          <section id="addresses" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#073729]">Saved Addresses</h3>
              <button
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm({
                    label: "Home",
                    address: "",
                    isDefault: addresses.length === 0,
                  });
                  setAddressModalOpen(true);
                }}
                className="text-xs font-bold text-[#16A34A] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {addresses.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">No saved addresses yet.</p>
              )}
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#073729]">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{addr.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingAddressId(addr.id);
                        setAddressForm({
                          label: addr.label,
                          address: addr.address,
                          isDefault: addr.isDefault,
                        });
                        setAddressModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-[#073729] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 5: FAVORITES (Saved Shops & Products)
          ══════════════════════════════════════════════════════════════ */}
          <section id="favorites" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#073729]">My Favorites</h3>
              <Link href="/favorites" className="text-xs font-bold text-[#16A34A] hover:underline">
                View all &gt;
              </Link>
            </div>

            {/* Saved Products */}
            <div>
              {favoriteProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No favorites yet. Tap the heart icon on any product to save it here.</p>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {favoriteProducts.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/products/${prod.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 border border-slate-100 shadow-2xs overflow-hidden relative">
                      <Image
                        src={prod.image_url}
                        alt={prod.name}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#073729] truncate group-hover:text-emerald-700">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-[#E85D04] font-semibold">{formatKSh(prod.price)} / {prod.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 6: NOTIFICATIONS
          ══════════════════════════════════════════════════════════════ */}
          <section id="notifications" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-[#073729] pb-3 border-b border-slate-100">
              Notifications
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { title: "Order updates", desc: "Order accepted, ready, & out for delivery alerts", unread: 2 },
                { title: "Promotions & offers", desc: "Weekly market discounts & bundle offers", unread: 1 },
                { title: "New products", desc: "New harvest arrivals in your favorite shops", unread: 0 },
                { title: "Seller updates", desc: "Messages & updates from followed farm shops", unread: 0 },
              ].map(({ title, desc, unread }) => (
                <button
                  key={title}
                  onClick={() => triggerToast(`Opened ${title}`)}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors px-1 rounded-xl cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-[#073729] flex items-center gap-2">
                      {title}
                      {unread > 0 && (
                        <span className="bg-[#E84919] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          {unread}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-400" />
                </button>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 7: MY REVIEWS
          ══════════════════════════════════════════════════════════════ */}
          <section id="reviews" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#073729]">My Reviews</h3>
              {reviewableProducts.length > 0 && (
                <button
                  onClick={() => {
                    setNewReview({ productId: reviewableProducts[0].id, stars: 5, comment: "" });
                    setWriteReviewOpen(true);
                  }}
                  className="text-xs font-bold text-[#16A34A] hover:text-emerald-700 cursor-pointer"
                >
                  + Write a Review
                </button>
              )}
            </div>

            <div className="space-y-3 mt-3">
              {reviews.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {reviewableProducts.length === 0 ? "Order something to leave your first review." : "No reviews yet."}
                </p>
              )}
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#073729]">{rev.products?.name ?? "Product"}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 my-1 text-xs">
                    {"★".repeat(rev.rating)}
                  </div>
                  <p className="text-xs text-slate-600 italic">“{rev.comment}”</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 8: PREFERENCES
          ══════════════════════════════════════════════════════════════ */}
          <section id="preferences" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-[#073729] pb-3 border-b border-slate-100">
              Preferences
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Language</span>
                <button
                  onClick={() => {
                    const nextLang = preferences.language === "English" ? "Kiswahili" : "English";
                    setPreferences({ ...preferences, language: nextLang });
                    triggerToast(`Language switched to ${nextLang}`);
                  }}
                  className="font-bold text-[#073729] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {preferences.language} &gt;
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Notifications</span>
                <button
                  onClick={() => {
                    const nextVal = !preferences.notifications;
                    setPreferences({ ...preferences, notifications: nextVal });
                    triggerToast(`Notifications turned ${nextVal ? "On" : "Off"}`);
                  }}
                  className="font-bold text-[#073729] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {preferences.notifications ? "On" : "Off"} &gt;
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Location</span>
                <button
                  onClick={() => {
                    const currentIndex = LOCATIONS.indexOf(preferences.location);
                    const nextArea = LOCATIONS[(currentIndex + 1) % LOCATIONS.length];
                    setPreferences({ ...preferences, location: nextArea });
                    triggerToast(`Delivery area set to ${nextArea}`);
                  }}
                  className="font-bold text-[#073729] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {preferences.location} &gt;
                </button>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 9: HELP & SUPPORT
          ══════════════════════════════════════════════════════════════ */}
          <section id="help" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-[#073729] pb-3 border-b border-slate-100">
              Help & Support
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { label: "Help Center", href: "/help" },
                { label: "Contact MamaFresh", href: "/contact" },
                { label: "Report a Problem", href: "/contact?topic=problem" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="py-3 flex items-center justify-between font-semibold text-slate-700 hover:text-[#073729] hover:bg-slate-50/60 px-1 rounded-xl transition-colors"
                >
                  <span>{label}</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 10: ACCOUNT SECURITY
          ══════════════════════════════════════════════════════════════ */}
          <section id="security" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-[#073729] pb-3 border-b border-slate-100">
              Security
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <button
                onClick={() => setSecurityModal("password")}
                className="w-full py-3 flex items-center justify-between font-semibold text-slate-700 hover:text-[#073729] hover:bg-slate-50/60 px-1 rounded-xl transition-colors text-left cursor-pointer"
              >
                <span>Change password</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => setSecurityModal("phone_email")}
                className="w-full py-3 flex items-center justify-between font-semibold text-slate-700 hover:text-[#073729] hover:bg-slate-50/60 px-1 rounded-xl transition-colors text-left cursor-pointer"
              >
                <span>Phone & email</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => setSecurityModal("activity")}
                className="w-full py-3 flex items-center justify-between font-semibold text-slate-700 hover:text-[#073729] hover:bg-slate-50/60 px-1 rounded-xl transition-colors text-left cursor-pointer"
              >
                <span>Login activity</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              CARD 11: LOGOUT ROW
          ══════════════════════════════════════════════════════════════ */}
          <div className="pt-2">
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>

          {/* Footer */}
          <div className="pt-4 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>© {new Date().getFullYear()} MamaFresh. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/help" className="hover:text-[#073729] transition-colors">Help & Support</Link>
              <span>·</span>
              <Link href="/about" className="hover:text-[#073729] transition-colors">About Us</Link>
              <span>·</span>
              <Link href="/seller" className="hover:text-[#073729] transition-colors">Sell on MamaFresh</Link>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: EDIT PROFILE
      ══════════════════════════════════════════════════════════════ */}
      {editProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setEditProfileOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#073729]">Edit Profile</h3>
              <button
                onClick={() => setEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold text-[#073729] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold text-[#073729] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold text-[#073729] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold shadow cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT ADDRESS
      ══════════════════════════════════════════════════════════════ */}
      {addressModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setAddressModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#073729]">
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Name / Label (e.g. Home, Work)</label>
                <input
                  type="text"
                  required
                  placeholder="Home, Office, Mum's..."
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-[#073729] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Full Address</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Sunrise Apartments, Block B 302, Kasarani-Mwiki Road, Kasarani, Nairobi"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isDefault" className="font-semibold text-slate-700 select-none">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold shadow cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: WRITE REVIEW
      ══════════════════════════════════════════════════════════════ */}
      {writeReviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setWriteReviewOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-fade-in text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#073729]">Write a Review</h3>
              <button
                onClick={() => setWriteReviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 mt-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Product</label>
                <select
                  value={newReview.productId}
                  onChange={(e) => setNewReview({ ...newReview, productId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-[#073729] focus:outline-none"
                >
                  {reviewableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Rating</label>
                <div className="flex gap-2 text-2xl text-amber-400 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setNewReview({ ...newReview, stars: star })}
                    >
                      {star <= newReview.stars ? "★" : "☆"}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Your feedback</label>
                <textarea
                  rows={3}
                  placeholder="Share your experience with the produce quality..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setWriteReviewOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newReview.comment || !newReview.productId || !userId) {
                      triggerToast("Please write a short comment!");
                      return;
                    }
                    const supabase = getSupabaseBrowserClient();
                    const { data, error } = await supabase.from("reviews").insert({
                      product_id: newReview.productId,
                      user_id: userId,
                      author_name: profile.name,
                      rating: newReview.stars,
                      comment: newReview.comment,
                    }).select("*, products(name)").single();
                    if (error || !data) {
                      triggerToast(error?.message ?? "Unable to submit review.");
                      return;
                    }
                    setReviews((prev) => [data as unknown as ReviewWithProduct, ...prev]);
                    setWriteReviewOpen(false);
                    setNewReview({ productId: reviewableProducts[0]?.id ?? "", stars: 5, comment: "" });
                    triggerToast("Thank you for your review!");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: SECURITY ACTIONS
      ══════════════════════════════════════════════════════════════ */}
      {securityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setSecurityModal(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-fade-in text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#073729]">
                {securityModal === "password" && "Change Password"}
                {securityModal === "phone_email" && "Phone & Email Verification"}
                {securityModal === "activity" && "Recent Login Activity"}
              </h3>
              <button
                onClick={() => setSecurityModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {securityModal === "password" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newPassword = String(formData.get("newPassword") ?? "");
                  const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: newPassword });
                  setSecurityModal(null);
                  triggerToast(error ? error.message : "Password updated successfully!");
                }}
                className="space-y-3 mt-4"
              >
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="Current Password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={8}
                  placeholder="New Password (min 8 chars)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#16A34A] text-white rounded-xl font-bold mt-2 cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            )}

            {securityModal === "phone_email" && (
              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-[#073729]">Email Verified</p>
                  <p className="text-slate-500 mt-0.5">{profile.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-[#073729]">Phone (M-Pesa linked)</p>
                  <p className="text-slate-500 mt-0.5">{profile.phone}</p>
                </div>
                <button
                  onClick={() => setSecurityModal(null)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold mt-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {securityModal === "activity" && (
              <div className="space-y-2 mt-4">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="font-bold text-[#073729]">Current session</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">You&apos;re signed in on this device right now.</p>
                </div>
                <p className="text-slate-400 text-[11px] px-1">Detailed login history isn&apos;t available yet.</p>
                <button
                  onClick={() => setSecurityModal(null)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold mt-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: LOGOUT CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════════ */}
      {logoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setLogoutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-fade-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <LogOut size={22} />
            </div>

            <h3 className="text-lg font-black text-[#073729]">
              Log out of MamaFresh?
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 px-4">
              You will need to sign in again to place orders and manage your saved addresses.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { error } = await getSupabaseBrowserClient().auth.signOut();
                  if (error) {
                    triggerToast(error.message);
                    return;
                  }
                  setLogoutModalOpen(false);
                  router.replace("/login");
                  router.refresh();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Feedback ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#073729] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-up border border-emerald-500/30">
          <ShieldCheck size={16} className="text-[#84CC16]" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
