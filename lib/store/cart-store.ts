import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  product_id: string;
  variant_id: string;
  title: string;
  primary_image: string | null;
  size: string;
  color: string | null;
  offer_price: number;
  sale_price: number;
  mrp: number;
  offer_label: string | null;
}

export interface CartItem extends CartProduct {
  qty: number;
}

interface CartState {
  items: CartItem[];
  menuSlug: string | null;
  addItem: (product: CartProduct) => void;
  removeItem: (product_id: string, variant_id: string, size: string) => void;
  updateQty: (product_id: string, variant_id: string, size: string, qty: number) => void;
  clearCart: () => void;
  setMenuSlug: (slug: string) => void;
  get total(): number;
  get itemCount(): number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      menuSlug: null,

      addItem: (product) => {
        set((state) => {
          const key = `${product.product_id}_${product.variant_id}_${product.size}`;
          const existingIdx = state.items.findIndex(
            i => i.product_id === product.product_id && i.variant_id === product.variant_id && i.size === product.size
          );
          if (existingIdx >= 0) {
            const updated = [...state.items];
            updated[existingIdx] = { ...updated[existingIdx], qty: updated[existingIdx].qty + 1 };
            return { items: updated };
          }
          return { items: [...state.items, { ...product, qty: 1 }] };
        });
      },

      removeItem: (product_id, variant_id, size) => {
        set(state => ({
          items: state.items.filter(i => !(i.product_id === product_id && i.variant_id === variant_id && i.size === size))
        }));
      },

      updateQty: (product_id, variant_id, size, qty) => {
        if (qty <= 0) {
          get().removeItem(product_id, variant_id, size);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product_id === product_id && i.variant_id === variant_id && i.size === size
              ? { ...i, qty }
              : i
          )
        }));
      },

      clearCart: () => set({ items: [] }),
      setMenuSlug: (slug) => set({ menuSlug: slug }),

      get total() {
        return get().items.reduce((sum, item) => sum + item.offer_price * item.qty, 0);
      },
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    { name: "snarky-cart" }
  )
);
