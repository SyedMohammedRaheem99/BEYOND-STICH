/**
 * Order lifecycle rules.
 *
 * The admin API previously accepted any status from any status, so an order
 * could go delivered → cancelled, cancelled → delivered, or straight from
 * placed → delivered with no tracking ever recorded. Each of those writes
 * cleanly to the database and leaves the order history nonsensical.
 *
 * This module is the single source of truth for what may follow what, and
 * for the side effects each move implies. It is pure — no database, no
 * network — so it can be used by the API, the UI, and tests alike.
 */

/**
 * Legal next states for each status.
 *
 * `delivered` deliberately cannot go to `cancelled`: once a parcel is in the
 * customer's hands the remedy is a RETURN (goods come back, stock is
 * restored, money is refunded), not a cancellation. Allowing both made
 * "cancelled" mean two different things in the revenue figures.
 *
 * `cancelled` and `returned` are terminal. Reopening them would mean
 * re-reserving stock that has already been restored, and there is no safe
 * way to do that automatically.
 */
export const TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  // A parcel can go missing in transit, so cancellation stays available
  // right up to delivery.
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

/** The happy path, in order. Used for the "advance to next stage" button. */
export const FORWARD_FLOW = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];

export const TERMINAL_STATUSES = ['cancelled', 'returned'];

/** Statuses after which the goods are no longer with us. */
export const STOCK_CONSUMING = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function nextStatus(current) {
  const i = FORWARD_FLOW.indexOf(current);
  return i >= 0 && i < FORWARD_FLOW.length - 1 ? FORWARD_FLOW[i + 1] : null;
}

export function allowedNext(current) {
  return TRANSITIONS[current] || [];
}

export function canTransition(from, to) {
  if (from === to) return true; // a no-op save is harmless
  return allowedNext(from).includes(to);
}

/**
 * Why a transition was refused, phrased for the person clicking the button
 * rather than for a log file.
 */
export function transitionError(from, to) {
  if (canTransition(from, to)) return null;

  const label = (s) => String(s || '').replace(/_/g, ' ');

  if (isTerminal(from)) {
    return `This order is already ${label(from)} — that is final and cannot be changed.`;
  }
  if (from === 'delivered' && to === 'cancelled') {
    return 'A delivered order cannot be cancelled. Mark it RETURNED instead — that restores stock and lets you refund.';
  }
  if (FORWARD_FLOW.indexOf(to) < FORWARD_FLOW.indexOf(from)) {
    return `Cannot move an order backwards from ${label(from)} to ${label(to)}.`;
  }
  const allowed = allowedNext(from);
  return allowed.length
    ? `From ${label(from)} you can only move to: ${allowed.map(label).join(', ')}.`
    : `No further changes are possible from ${label(from)}.`;
}

/**
 * Does moving from → to put the goods back on the shelf?
 *
 * Checkout decrements stock when the order is created, but cancelling only
 * ever rewrote a text field — so every cancelled order permanently removed
 * its units from inventory. The store would show SOLD OUT for tees sitting
 * in the cupboard.
 */
export function shouldRestoreStock(from, to) {
  return STOCK_CONSUMING.includes(from) && TERMINAL_STATUSES.includes(to);
}

/**
 * Describes a status change so the UI can warn before it happens, and so
 * every confirmation dialog says the same thing as the API enforces.
 *
 * `destructive` drives whether a confirmation is required at all.
 */
export function describeTransition(order, to) {
  const from = order?.orderStatus;
  const effects = [];
  let destructive = false;

  if (to === 'cancelled') {
    destructive = true;
    effects.push('The order will be cancelled. This cannot be undone.');
  }
  if (to === 'returned') {
    destructive = true;
    effects.push('The order will be marked returned. This cannot be undone.');
  }

  if (shouldRestoreStock(from, to)) {
    const units = (order?.items || []).reduce((n, i) => n + (i.quantity || 0), 0);
    effects.push(`${units} unit${units === 1 ? '' : 's'} will be returned to stock.`);
  }

  if (to === 'shipped') {
    effects.push('The customer will be emailed a shipping notification.');
  }
  if (to === 'delivered') {
    effects.push('The 7-day return window starts today.');
  }
  if (to === 'cancelled') {
    effects.push('The customer will be emailed that their order was cancelled.');
  }

  // Money that has actually been taken needs a decision; money never taken
  // does not. Saying so up front avoids a silent "cancelled but not
  // refunded" order sitting in the books.
  if (to === 'cancelled' && order?.paymentStatus === 'paid') {
    effects.push(
      `₹${Number(order.total || 0).toLocaleString('en-IN')} has already been paid — remember to refund it.`
    );
  }

  return { destructive, effects };
}
