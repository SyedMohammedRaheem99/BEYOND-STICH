'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SHIPPING } from '@/lib/constants';

// ============================================
// Cart Store
// ============================================
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      // False until localStorage has been restored (see StoreHydration).
      // Lets the UI tell "cart is genuinely empty" apart from "not loaded
      // yet", so /checkout doesn't flash its empty-bag screen on every visit.
      hydrated: false,

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
          // Replace the item rather than mutating it. Copying only the array
          // left the item object identical, so components subscribed to it
          // could keep showing the old quantity and subtotal.
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + 1,
          };
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

      // Reconcile the persisted cart against what the server says is true.
      // Returns a list of plain-language changes so the UI can tell the
      // customer what moved before they pay, rather than surprising them at
      // the door on a COD order.
      syncWithServer: async () => {
        const items = get().items;
        if (items.length === 0) return [];

        try {
          const res = await fetch('/api/cart/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: items.map((i) => ({
                slug: i.slug,
                size: i.size,
                quantity: i.quantity,
                price: i.price,
              })),
            }),
          });
          if (!res.ok) return [];

          const data = await res.json();
          if (!data.hasChanges) return [];

          const notices = [];
          const byKey = new Map(data.items.map((r) => [`${r.slug}|${r.size}`, r]));

          const nextItems = items.reduce((acc, item) => {
            const r = byKey.get(`${item.slug}|${item.size}`);
            if (!r || r.status === 'ok') {
              acc.push(r?.price ? { ...item, price: r.price, mrp: r.mrp ?? item.mrp } : item);
              return acc;
            }

            if (r.status === 'unavailable' || r.status === 'out_of_stock') {
              notices.push(`${r.name || item.name} (${item.size}) is no longer available and was removed.`);
              return acc; // drop it
            }

            if (r.status === 'low_stock') {
              notices.push(`Only ${r.availableQty} left of ${r.name} (${item.size}) — quantity updated.`);
              acc.push({ ...item, quantity: r.availableQty, price: r.price, mrp: r.mrp ?? item.mrp });
              return acc;
            }

            if (r.status === 'price_changed') {
              notices.push(
                `${r.name} (${item.size}) is now ₹${r.price} (was ₹${r.oldPrice}).`
              );
              acc.push({ ...item, price: r.price, mrp: r.mrp ?? item.mrp });
              return acc;
            }

            acc.push(item);
            return acc;
          }, []);

          set({ items: nextItems });
          return notices;
        } catch {
          // Never block checkout on this; the order API re-prices anyway.
          return [];
        }
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
        return subtotal >= SHIPPING.FREE_THRESHOLD ? 0 : SHIPPING.FLAT_RATE;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShipping();
      },
    }),
    {
      name: 'beyond-stich-cart',
      // Zustand rehydrates from localStorage synchronously at module load, so
      // the client's first render already had the saved cart while the server
      // rendered an empty one. React then threw away the mismatched subtree
      // and re-rendered — the cart badge popping in, and /checkout flashing
      // "YOUR BAG IS EMPTY" before the real page. Rehydration is now deferred
      // to StoreHydration, which runs it inside an effect after mount.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        // Runs after rehydrate() finishes, including when there was nothing
        // stored — so the flag is always set and the UI never stays stuck.
        useCartStore.setState({ hydrated: true });
      },
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
                images: product.images,
                price: product.price,
                mrp: product.mrp,
                segment: product.segment,
                sizes: product.sizes,
                colors: product.colors,
                averageRating: product.averageRating,
                tags: product.tags,
              },
            ],
          });
          get().syncToServer();
        }
      },

      removeFromWishlist: (productId) => {
        set({
          items: get().items.filter((item) => item._id !== productId),
        });
        get().syncToServer();
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item._id === productId);
      },

      clearWishlist: () => set({ items: [] }),

      // Sync local wishlist slugs to server (fire-and-forget)
      syncToServer: () => {
        const slugs = get().items.map(item => item.slug).filter(Boolean);
        fetch('/api/user/wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs }),
        }).catch(() => {});
      },

      // Load wishlist from server (called after login)
      loadFromServer: async () => {
        try {
          const res = await fetch('/api/user/wishlist');
          if (res.ok) {
            const data = await res.json();
            if (data.wishlist?.length > 0) {
              // Merge server wishlist with local (server wins for dupes)
              const localItems = get().items;
              const serverSlugs = new Set(data.wishlist.map(p => p.slug));
              const merged = [
                ...data.wishlist,
                ...localItems.filter(item => !serverSlugs.has(item.slug)),
              ];
              set({ items: merged });
            }
          }
        } catch {}
      },
    }),
    {
      // Same reason as the cart: wishlist hearts on every product card
      // mismatched between server and client render.
      name: 'beyond-stich-wishlist',
      skipHydration: true,
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
