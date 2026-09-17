"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Save, Store, Clock, MapPin } from "lucide-react";
import { useCurrentSeller } from "@/lib/hooks/useCurrentSeller";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SellerSettingsPage() {
  const { seller, loading: sellerLoading } = useCurrentSeller();

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [estate, setEstate] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seller) return;
    queueMicrotask(() => {
      setShopName(seller.name);
      setDescription(seller.description);
      setPhone(seller.phone);
      setLocation(seller.location);
      setEstate(seller.estate);
      setOpeningTime(seller.opening_time);
      setClosingTime(seller.closing_time);
      setDeliveryAvailable(seller.delivery_available);
      setDeliveryFee(String(seller.delivery_fee));
    });
  }, [seller]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await getSupabaseBrowserClient()
      .from("sellers")
      .update({
        name: shopName,
        description,
        phone,
        location,
        estate,
        opening_time: openingTime,
        closing_time: closingTime,
        delivery_available: deliveryAvailable,
        delivery_fee: Number(deliveryFee) || 0,
      })
      .eq("id", seller.id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  if (sellerLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-400">Loading...</div>;
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-black text-gray-800">You don&apos;t have a shop yet</p>
        <Link href="/seller/register" className="rounded-full bg-[#073729] px-6 py-3 text-xs font-bold text-white">Register your shop</Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-24 max-w-md mx-auto lg:max-w-2xl">
      <div>
        <h1 className="text-lg font-black text-[#0B3D2E]">Shop Settings & Profile</h1>
        <p className="text-xs text-gray-500">Configure your storefront visible to neighborhood buyers</p>
      </div>

      {saved && (
        <div className="bg-[#DCFCE7] border border-[#B6E2BA] text-[#15803d] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Shop settings updated successfully!</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {/* Shop Name & Bio */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 mb-1 text-xs font-extrabold text-[#0B3D2E]">
            <Store size={15} />
            <span>Storefront Profile</span>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Description / Specialty</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 h-fit">
          <div className="flex items-center gap-2 mb-1 text-xs font-extrabold text-[#0B3D2E]">
            <Clock size={15} />
            <span>Operating Hours</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Opening Time</label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Closing Time</label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
          </div>
        </div>

        {/* Location & Delivery */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1 text-xs font-extrabold text-[#0B3D2E]">
            <MapPin size={15} />
            <span>Location & Delivery Options</span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Neighborhood Area</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Stall Number / Estate</label>
            <input
              type="text"
              value={estate}
              onChange={(e) => setEstate(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-gray-800">Local Delivery Available</p>
              <p className="text-[10px] text-gray-400">Offer doorstep dispatch via local riders</p>
            </div>
            <button
              type="button"
              onClick={() => setDeliveryAvailable(!deliveryAvailable)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                deliveryAvailable ? "bg-[#16A34A]" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  deliveryAvailable ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {deliveryAvailable && (
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Delivery Fee (KSh)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-[#0B3D2E] hover:bg-[#166534] text-white text-xs font-black shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 lg:col-span-2 disabled:opacity-60"
        >
          <Save size={15} />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </form>
    </div>
  );
}
