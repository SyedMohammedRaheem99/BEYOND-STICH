'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Sends a pageview on every route change.
 *
 * The App Router navigates without a document load, so a provider's
 * built-in pageview fires only for the first page a visitor lands on —
 * every subsequent step of the funnel would be invisible. GA4's automatic
 * pageview is disabled in AnalyticsScripts for exactly this reason, and
 * this replaces it.
 *
 * Renders nothing.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The first pageview is already sent by the init snippet; without this
  // the landing page would be counted twice.
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_path: url,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
    } catch {
      // Analytics must never break navigation.
    }
  }, [pathname, searchParams]);

  return null;
}
