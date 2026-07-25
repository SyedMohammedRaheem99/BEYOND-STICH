'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Cart Store
// ============================================
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Open/close cart drawer
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Add item to cart
      addItem: (product, size, color = 'Black') => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.productId === product._id &&
            item.size === size &&
            item.color === color
        );

        if (existingIndex > -1) {
          // Update quantity
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += 1;
          set({ items: updatedItems, isOpen: true });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                productId: product._id,
                name: product.name,
                slug: product.slug,
                image: product.images[0],
                price: product.price,
                mrp: product.mrp,
                size,
                color,
                segment: product.segment,
                quantity: 1,
              },
            ],
            isOpen: true,
          });
        }
      },

      // Remove item
      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.size === size &&
                item.color === color
              )
          ),
        });
      },

      // Update quantity
      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.productId === productId &&
            item.size === size &&
            item.color === color
              ? { ...item, quantity }
              : item
          ),
        });
      },

      // Clear cart
      clearCart: () => set({ items: [], isOpen: false }),

      // Computed
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      getSavings: () =>
        get().items.reduce(
          (sum, item) => sum + (item.mrp - item.price) * item.quantity,
          0
        ),

      getShipping: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 999 ? 0 : 79;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShipping();
      },
    }),
    {
      name: 'beyond-stich-cart',
    }
  )
);

// ============================================
// Wishlist Store
// ============================================
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (product) => {
        const exists = get().items.find((item) => item._id === product._id);
        if (!exists) {
          set({
            items: [
              ...get().items,
              {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.images[0],
                price: product.price,
                mrp: product.mrp,
                segment: product.segment,
              },
            ],
          });
        }
      },

      removeFromWishlist: (productId) => {
        set({
          items: get().items.filter((item) => item._id !== productId),
        });
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item._id === productId);
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'beyond-stich-wishlist',
    }
  )
);

// ============================================
// UI Store (cursor, loader, etc.)
// ============================================
export const useUIStore = create((set) => ({
  isLoading: true,
  cursorVariant: 'default',
  cursorText: '',

  setLoading: (isLoading) => set({ isLoading }),
  setCursorVariant: (variant) => set({ cursorVariant: variant }),
  setCursorText: (text) => set({ cursorText: text }),
  resetCursor: () => set({ cursorVariant: 'default', cursorText: '' }),
}));
