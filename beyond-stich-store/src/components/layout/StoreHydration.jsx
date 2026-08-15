'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore, useWishlistStore } from '@/lib/store';

/**
 * Rehydrates the persisted cart and wishlist after mount, and pulls the
 * server-side wishlist once a session exists.
 *
 * Both stores set `skipHydration: true` so that server and client render the
 * same empty state — otherwise zustand restores localStorage synchronously at
 * module load and every persisted read (cart badge, wishlist hearts, the
 * checkout page's empty-bag branch) mismatches on hydration and gets thrown
 * away and re-rendered. That mismatch was the visible "glitch".
 *
 * Renders nothing.
 */
export default function StoreHydration() {
  const { status } = useSession();
  const loadedForSession = useRef(false);

  // Restore localStorage once, after the first client render.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  // Pull the saved wishlist down when the user is signed in. Without this the
  // local (empty) wishlist was authoritative on a new device, and the first
  // toggle synced that empty list up — wiping the server copy.
  useEffect(() => {
    if (status !== 'authenticated' || loadedForSession.current) return;
    loadedForSession.current = true;
    useWishlistStore.getState().loadFromServer();
  }, [status]);

  return null;
}
