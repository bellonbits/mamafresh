// lib/store/cart.ts
// Zustand cart store — persisted to localStorage

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductRow } from "@/lib/supabase/types";

export interface CartItem {
  product: ProductRow;
  quantity: number;
}

export interface AppliedPromo {
  code: string;
  discountPercent: number;
  title: string;
}

interface CartStore {
  items: CartItem[];
  sellerId: string | null;
  appliedPromo: AppliedPromo | null;
  addItem: (product: ProductRow, qty?: number) => { conflict: boolean };
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getDiscountAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sellerId: null,
      appliedPromo: null,

      addItem: (product, qty = 1) => {
        const { items, sellerId } = get();

        // Seller conflict check
        if (sellerId && sellerId !== product.seller_id) {
          return { conflict: true };
        }

        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: Math.round((i.quantity + qty) * 10) / 10 }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity: qty }],
            sellerId: product.seller_id,
          });
        }
        return { conflict: false };
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.product.id !== productId);
        set({
          items: newItems,
          sellerId: newItems.length === 0 ? null : get().sellerId,
          appliedPromo: newItems.length === 0 ? null : get().appliedPromo,
        });
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [], sellerId: null, appliedPromo: null }),

      setAppliedPromo: (promo) => set({ appliedPromo: promo }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + i.product.price * i.quantity,
          0
        ),

      getDiscountAmount: () => {
        const { appliedPromo } = get();
        if (!appliedPromo) return 0;
        return Math.round(get().getTotalPrice() * (appliedPromo.discountPercent / 100));
      },
    }),
    { name: "mamafresh-cart-v3" }
  )
);
