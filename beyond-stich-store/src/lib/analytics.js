'use client';

/**
 * Conversion tracking.
 *
 * One `track()` call per shopping event, fanned out to whichever providers
 * are configured. Call sites never name a provider, so adding or removing
 * one is an environment change, not a code change — the same reason
 * lib/mailer.js keeps its transport behind a seam.
 *
 * Nothing here throws. An ad blocker, a failed script load or a missing
 * measurement ID must never break add-to-cart or checkout: a dropped
 * analytics event costs a data point, a thrown one costs an order.
 *
 * Configure with:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890
 *
 * Either may be absent; absent simply means that provider is off.
 */

const CURRENCY = 'INR';

/** True only in a browser where the provider's script has loaded. */
const hasGA = () => typeof window !== 'undefined' && typeof window.gtag === 'function';
const hasMeta = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

/**
 * GA4 and Meta expect different item shapes for the same product, so the
 * mapping lives here rather than at ~8 call sites.
 */
function toGaItem(product, extra = {}) {
  return {
    item_id: product.slug || product._id,
    item_name: product.name,
    item_brand: 'Beyond Stich',
    item_category: product.segment,
    item_category2: product.productType,
    item_variant: [extra.size, extra.color].filter(Boolean).join(' / ') || undefined,
    price: Number(product.price) || 0,
    quantity: extra.quantity || 1,
  };
}

function toMetaContent(product, extra = {}) {
  return {
    id: product.slug || product._id,
    quantity: extra.quantity || 1,
    item_price: Number(product.price) || 0,
  };
}

/**
 * Send one event. Provider-specific names are mapped internally — GA4 and
 * Meta disagree on almost every one.
 */
export function track(event, payload = {}) {
  try {
    if (hasGA()) {
      window.gtag('event', event, payload.ga ?? {});
    }
    if (hasMeta() && payload.meta) {
      // Meta splits its vocabulary into Standard and Custom events; the
      // standard ones are what its optimiser actually understands.
      const [metaEvent, metaData] = payload.meta;
      const method = payload.metaCustom ? 'trackCustom' : 'track';
      window.fbq(method, metaEvent, metaData || {});
    }
  } catch {
    // Deliberately silent — see the module comment.
  }
}

// --- The funnel ----------------------------------------------------------

/** A product page was opened. */
export function trackViewItem(product) {
  if (!product) return;
  const value = Number(product.price) || 0;
  track('view_item', {
    ga: { currency: CURRENCY, value, items: [toGaItem(product)] },
    meta: ['ViewContent', {
      content_ids: [product.slug || product._id],
      content_type: 'product',
      content_name: product.name,
      value,
      currency: CURRENCY,
    }],
  });
}

/** A size was chosen and the product went into the bag. */
export function trackAddToCart(product, { size, color, quantity = 1 } = {}) {
  if (!product) return;
  const value = (Number(product.price) || 0) * quantity;
  track('add_to_cart', {
    ga: { currency: CURRENCY, value, items: [toGaItem(product, { size, color, quantity })] },
    meta: ['AddToCart', {
      content_ids: [product.slug || product._id],
      content_type: 'product',
      contents: [toMetaContent(product, { quantity })],
      value,
      currency: CURRENCY,
    }],
  });
}

export function trackRemoveFromCart(item) {
  if (!item) return;
  track('remove_from_cart', {
    ga: {
      currency: CURRENCY,
      value: (Number(item.price) || 0) * (item.quantity || 1),
      items: [toGaItem(item, { size: item.size, color: item.color, quantity: item.quantity })],
    },
  });
}

/** The cart drawer was opened. */
export function trackViewCart(items = [], value = 0) {
  track('view_cart', {
    ga: {
      currency: CURRENCY,
      value,
      items: items.map((i) => toGaItem(i, { size: i.size, color: i.color, quantity: i.quantity })),
    },
  });
}

/** Checkout was reached. The step ads optimise against most heavily. */
export function trackBeginCheckout(items = [], value = 0) {
  track('begin_checkout', {
    ga: {
      currency: CURRENCY,
      value,
      items: items.map((i) => toGaItem(i, { size: i.size, color: i.color, quantity: i.quantity })),
    },
    meta: ['InitiateCheckout', {
      content_ids: items.map((i) => i.slug || i.productId),
      content_type: 'product',
      contents: items.map((i) => toMetaContent(i, { quantity: i.quantity })),
      num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
      value,
      currency: CURRENCY,
    }],
  });
}

/** A payment method was selected. */
export function trackAddPaymentInfo(value, paymentMethod) {
  track('add_payment_info', {
    ga: { currency: CURRENCY, value, payment_type: paymentMethod },
    meta: ['AddPaymentInfo', { value, currency: CURRENCY }],
  });
}

/**
 * An order was placed.
 *
 * `transaction_id` is the order number so a refund can be matched later,
 * and so a page refresh does not double-count — both providers dedupe on
 * it.
 */
export function trackPurchase(order, items = []) {
  if (!order) return;
  const value = Number(order.total) || 0;
  track('purchase', {
    ga: {
      transaction_id: order.orderNumber,
      currency: CURRENCY,
      value,
      shipping: Number(order.shipping) || 0,
      coupon: order.couponCode || undefined,
      items: items.map((i) => toGaItem(i, { size: i.size, color: i.color, quantity: i.quantity })),
    },
    meta: ['Purchase', {
      content_ids: items.map((i) => i.slug || i.productId),
      content_type: 'product',
      contents: items.map((i) => toMetaContent(i, { quantity: i.quantity })),
      num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
      value,
      currency: CURRENCY,
      // Lets Meta dedupe a browser event against a future server-side one.
      eventID: order.orderNumber,
    }],
  });
}

// --- Secondary signals ---------------------------------------------------

export function trackSearch(term) {
  if (!term) return;
  track('search', {
    ga: { search_term: term },
    meta: ['Search', { search_string: term }],
  });
}

export function trackSignUp(method = 'email') {
  track('sign_up', {
    ga: { method },
    meta: ['CompleteRegistration', { status: true }],
  });
}

export function trackLogin(method = 'email') {
  track('login', { ga: { method } });
}

export function trackAddToWishlist(product) {
  if (!product) return;
  track('add_to_wishlist', {
    ga: {
      currency: CURRENCY,
      value: Number(product.price) || 0,
      items: [toGaItem(product)],
    },
    meta: ['AddToWishlist', {
      content_ids: [product.slug || product._id],
      content_type: 'product',
      value: Number(product.price) || 0,
      currency: CURRENCY,
    }],
  });
}

/**
 * A PIN code was checked. Not a standard event, but it answers a question
 * ads alone cannot: how much demand exists outside the delivery area.
 */
export function trackDeliveryCheck(pincode, serviceable) {
  track('delivery_check', {
    ga: { pincode, serviceable },
    meta: ['DeliveryCheck', { pincode, serviceable }],
    metaCustom: true,
  });
}
