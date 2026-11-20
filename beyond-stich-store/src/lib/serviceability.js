import DeliveryZone from '@/lib/models/DeliveryZone';

/**
 * Where the store delivers, and how long it takes.
 *
 * One source of truth for the PDP check, the checkout form and the order
 * API. The PDP used to decide this in the browser with
 * `/^[14578]/.test(pincode) ? 3 : 6`, so every six-digit number was
 * "serviceable" with an invented date — a customer 2,000km outside the
 * delivery area could place a COD order no courier would accept.
 *
 * Coverage is held as PIN-code ranges rather than a row per code: Indian
 * PIN codes are allocated geographically, so a service area is naturally a
 * range, and a handful of editable rows is something an operator can
 * actually reason about.
 *
 * Assumes connectDB() has already been awaited by the caller.
 */

/** Delivery window per tier, in working days. */
export const ZONE_DAYS = {
  local: { min: 1, max: 2 },  // Bengaluru city
  nearby: { min: 2, max: 4 }, // Karnataka and the neighbouring belt
  rest: { min: 4, max: 7 },   // anywhere else we choose to open up
};

export const ZONE_LABELS = {
  local: 'Bengaluru',
  nearby: 'Nearby',
  rest: 'Rest of India',
};

/** True only for a syntactically valid Indian PIN code. */
export function isValidPincode(value) {
  return /^[1-9][0-9]{5}$/.test(String(value || '').trim());
}

/** Add working days, skipping Sundays — the courier does not deliver then. */
function addWorkingDays(days) {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added += 1;
  }
  return d;
}

const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * Look up a PIN code.
 *
 * Returns { serviceable, pincode, zone, city, codAvailable, daysMin,
 * daysMax, etaLabel, reason }. `serviceable: false` always carries a
 * `reason` fit to show a customer.
 */
export async function checkPincode(value) {
  const pincode = String(value || '').trim();

  if (!isValidPincode(pincode)) {
    return { serviceable: false, pincode, invalid: true, reason: 'Enter a valid 6-digit PIN code' };
  }

  const n = parseInt(pincode, 10);
  const row = await DeliveryZone.findOne({
    active: true,
    rangeStart: { $lte: n },
    rangeEnd: { $gte: n },
  })
    .sort({ rangeStart: -1 }) // narrowest match wins where ranges overlap
    .lean();

  // Failing closed is deliberate. Promising delivery somewhere we cannot
  // reach is what produced COD parcels that came straight back.
  if (!row) {
    return {
      serviceable: false,
      pincode,
      reason: "We don't deliver to this PIN code yet.",
    };
  }

  const zone = ZONE_DAYS[row.zone] || ZONE_DAYS.rest;
  // An explicit 0 is meaningful ("same day"), so check null rather than
  // relying on truthiness.
  const min = row.deliveryDaysMin ?? zone.min;
  const max = row.deliveryDaysMax ?? zone.max;

  return {
    serviceable: true,
    pincode,
    zone: row.zone,
    city: row.name || '',
    codAvailable: row.codAvailable !== false,
    daysMin: min,
    daysMax: max,
    // Pre-formatted here so the PDP, checkout and emails cannot drift.
    etaLabel:
      min === max
        ? `Delivery by ${fmt(addWorkingDays(max))}`
        : `Delivery by ${fmt(addWorkingDays(min))} – ${fmt(addWorkingDays(max))}`,
  };
}

/**
 * Checkout gate. Returns an error string when the order must not proceed,
 * or null. Called from the order API so it cannot be bypassed by posting
 * straight to the endpoint.
 */
export async function validateDeliverable(pincode, { paymentMethod } = {}) {
  const result = await checkPincode(pincode);

  if (!result.serviceable) return result.reason;

  // A COD-disabled area is still serviceable — the customer just has to
  // pay online, so say that rather than refusing the order outright.
  if (paymentMethod === 'cod' && !result.codAvailable) {
    return 'Cash on delivery is not available for this PIN code. Please pay online to continue.';
  }

  return null;
}
