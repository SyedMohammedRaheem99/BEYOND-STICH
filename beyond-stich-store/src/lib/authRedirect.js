/**
 * Where a customer lands after signing in.
 *
 * The default used to be /account, which is the wrong place for a store: the
 * dashboard shows past orders and saved addresses, so it is a dead end for
 * someone who was mid-browse. Signing in should return them to whatever they
 * were doing, with their cart intact, ready to buy.
 */

/** Shopping, not the dashboard — the best guess when nothing else is known. */
export const DEFAULT_AFTER_SIGN_IN = '/shop';

/**
 * Pages that must never be used as a return target.
 *
 * Returning to an auth page after authenticating either loops the customer
 * straight back to where they started or drops them on a form they have
 * already completed.
 */
const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

/** True if `path` is somewhere worth returning to after signing in. */
export function isSafeReturnPath(path) {
  if (!path || typeof path !== 'string') return false;
  // Only same-origin paths. A full URL here would let a crafted link bounce
  // someone to another site straight after they authenticate.
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  return !AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Build the /login link for a signed-out customer, carrying them back to
 * `currentPath` afterwards.
 *
 * Used by the navbar and the bottom tab bar, which previously linked to a
 * bare /login and so dropped everyone on the dashboard regardless of where
 * they had been.
 */
export function signInHref(currentPath) {
  return isSafeReturnPath(currentPath)
    ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
    : '/login';
}

/**
 * Resolve the destination after a successful sign-in, given whatever
 * `callbackUrl` arrived in the query string.
 */
export function resolveAfterSignIn(callbackUrl) {
  return isSafeReturnPath(callbackUrl) ? callbackUrl : DEFAULT_AFTER_SIGN_IN;
}
