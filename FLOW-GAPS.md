# Flow gap audit — 2026-11-25

Triggered by: *"I am able to place an order without login. And if I do so, it
is not going in admin panel."*

Both halves of that turned out to be real, but they are **two unrelated
problems**, and the second one was far more serious than the first.

---

## Verified by running the code, not by reading it

Everything below was checked against the live apps and the live database.

---

## G1 — Admin orders + dashboard returned 500 on every request — FIXED

**Severity: critical. This was the actual cause of "not going in admin panel".**

Guest orders were never the problem. **No orders at all** were reaching the
admin panel, including orders from signed-in customers.

Three admin routes called `.populate('user', …)` without importing the `User`
model, so Mongoose had no schema registered and threw `MissingSchemaError` on
every query:

- `/api/orders` → 500
- `/api/orders/[id]` → 500
- `/api/dashboard` → 500

A fourth, separate bug in `/api/orders/[id]`: it also populated
`items.product`, a path that does not exist in the schema (order items store
`productSlug` + `name` + `image` + `segment` inline on purpose, so an order
still reads correctly after a product is renamed or deleted). That threw
`StrictPopulateError`, so even once the list worked, **opening an order still
failed**.

**The database was fine the whole time.** 18 orders, 16 of them guest
checkouts, including three recent ₹1 live-payment tests. Nothing was lost.

**Fixed and pushed** (`77d7c3d`). Verified: both endpoints return 200, all 18
orders list with the 16 guest rows visible, order detail opens with its line
items.

---

## G2 — A failed request renders as "no data" everywhere in the admin

**Severity: high. This is why G1 stayed hidden.**

Every admin page does:

```js
const res = await fetch('/api/orders');
if (res.ok) setOrders(data.orders);   // on failure: silently keep []
```

So a total outage looks identical to an empty collection. The orders page
cheerfully displayed "no orders" while 18 orders sat in the database and every
request 500'd.

Checked: `orders`, `products`, `users`, `reviews`, `coupons` — **none** of
them has an error state. The store app does this correctly (`/shop`,
`/checkout`, `/account/orders` all have `loadError` + retry), so this is an
admin-only gap.

**Not yet fixed.** Recommended next, because it protects every future change:
if a fetch fails, say so and offer a retry. Empty and broken must not look the
same.

---

## G3 — Checkout has no login requirement

**Severity: medium — this is a product decision, not a bug.**

Current behaviour, confirmed:
- Browsing: no account needed ✅
- Add to cart: no account needed ✅
- Checkout: **no account needed** — the session is used only to pre-fill the
  address and show "Have an account? Sign in"
- `POST /api/orders`: deliberately accepts a null `user` and records the email

So guest checkout works as designed. It is not an accident, and those 16 guest
orders are real orders that were paid for and emailed.

**Your preferred approach — add to cart freely, require login at checkout —
is the right call, and I agree with it.** Reasons:

- Add-to-cart is where you capture interest; a wall there costs you carts.
- Checkout is where an account genuinely helps *the customer*: order history,
  tracking, saved addresses, returns.
- It closes a real support problem: a guest who mistypes their email gets no
  confirmation and has no way to find their order.

**It is cheap to implement**, because there is exactly **one** route into
checkout — the cart drawer's `href="/checkout"` (there is no `/cart` page and
no "Buy now" button anywhere). So the gate needs:

1. The cart drawer's button → `/login?callbackUrl=/checkout` when signed out.
   `callbackUrl` is already honoured by the login page, so they land back in
   checkout after signing in.
2. `/checkout` itself redirects signed-out visitors (someone can type the URL).
3. `POST /api/orders` rejects an unauthenticated request — the real
   enforcement, since the first two are only UI.

**One caution worth your decision:** requiring login *does* cost conversions,
and India's D2C norm is guest checkout with an optional account. The honest
trade is "fewer abandoned carts" vs "every order attached to a real, verified
email". Your call — the OTP verification you added makes the account path more
trustworthy than most, which argues for your approach.

**What must not break:** existing guest orders are claimed by email after OTP
verification. Keep that, or those 16 orders become orphaned.

---

## G4 — Three ₹1 orders and an ₹1 test row in live data

**Severity: low, but worth doing before launch.**

`BS-MWU03YXT-1NOV`, `BS-MWSWY6DY-818F`, `BS-MWSVYO5P-JFDR` — all ₹1, all
`paid`, all `placed`. These are your Razorpay live tests. They will skew
revenue on the dashboard and look odd in the order list.

Recommend deleting them once you have confirmed payments work in production.
Not touched — they are real paid rows and deleting live payment records is
your decision, not mine.

---

## What is NOT broken (checked, so nobody re-investigates)

| Flow | Status |
|---|---|
| Guest orders saving to the database | Working — 16 of them |
| Admin order list excluding guests | No such filter exists; it was G1 |
| Order confirmation email, COD | Sent |
| Order confirmation email, online | Sent, on both the verify and webhook paths |
| Your new-order alert email | Sent, all paths |
| Server-side re-pricing | Working — client prices are never trusted |
| Stock reserved before order creation | Working |
| Coupon re-validation server-side | Working |
| Razorpay HMAC verification | Working, both paths |
| Webhook safety net if the browser dies | Working — `PendingOrder` + `consumed` flag |
| Pincode serviceability re-check | Working, fails closed |
| Shipping free for all orders | Confirmed — `FREE_THRESHOLD: 0` |
| Email OTP before an account works | Working, with existing users grandfathered |

---

## Suggested order of work

1. **G2** — admin error states. Cheap, and stops the next outage hiding.
2. **G3** — the login gate, if you confirm you want it.
3. **G4** — delete the ₹1 test orders after production payment is confirmed.
