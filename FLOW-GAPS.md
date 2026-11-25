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

## G2 — A failed request renders as "no data" everywhere in the admin — FIXED

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

**Fixed** (`c5fd1d9`). Two shared pieces rather than seven copies:
`lib/fetchJson.js` throws on a non-2xx carrying the server's own message, and
`components/LoadState.jsx` renders loading / error / empty, says plainly that a
failure is not an empty list, shows the real reason and offers a retry.

Applied to orders, products, users, reviews, coupons, homepage and banners.
Verified in a browser both ways: with every `/api/**` call forced to 500 all
seven show the error and a retry; healthy, all seven show their real rows.

---

## G3 — Checkout has no login requirement — FIXED (login now required)

**Severity: medium — this was a product decision, and you made it.**

Behaviour **before** this change:
- Browsing: no account needed
- Add to cart: no account needed
- Checkout: **no account needed** — the session only pre-filled the address
- `POST /api/orders`: accepted a null `user` and recorded the email

So guest checkout worked as designed. It was not an accident, and those 16
guest orders are real orders that were paid for and emailed.

Behaviour **now**: browse and add to cart stay open; checkout requires an
account.

Reasons this is the right split:

- Add-to-cart is where you capture interest; a wall there costs you carts.
- Checkout is where an account genuinely helps *the customer*: order history,
  tracking, saved addresses, returns.
- It closes a real support problem: a guest who mistypes their email gets no
  confirmation and has no way to find their order.

**Implemented** (`f931d84`), all three layers:

1. The cart drawer sends signed-out customers to
   `/login?callbackUrl=%2Fcheckout` and says the cart is saved.
2. `/checkout` redirects if unauthenticated — but **not** while the session
   status is still `loading`, which would bounce a signed-in customer.
3. `/api/orders` **and** `/api/razorpay/order` return 401 `AUTH_REQUIRED`.
   This is the real enforcement; both are reachable directly.

Ordering matters in two places. In `/api/orders` the auth check runs *before*
address and serviceability validation, so an unauthenticated request is told to
sign in rather than told its PIN code is wrong. In `/api/razorpay/order` it runs
*before* the gateway order exists — starting a payment for an order
`/api/orders` would then refuse means taking money that must be refunded.

`/api/razorpay/verify` is deliberately **not** gated: it runs after money has
been taken, so refusing a lapsed session there would charge the customer and
create no order.

Checkout also handles a session lapsing mid-flow — all three order calls route
a 401 to sign-in and back, rather than stranding the customer on an error.

**The trade you accepted:** requiring login does cost some conversions, and
India's D2C norm is guest checkout with an optional account. You chose every
order being attached to a verified email over fewer abandoned carts. Worth
re-reading the numbers after a few weeks live — if abandonment at the sign-in
step is high, G3 is reversible without touching anything else.

**Still intact:** the 16 existing guest orders are claimed by email after OTP
verification. That path was not changed, so they are not orphaned.

---

## G5 — Duplicate delivery zone silently disables COD for all of Bengaluru

**Severity: high. This is your data, not a code bug — so it is yours to fix.**

The `deliveryzones` collection holds three rows, two of which cover the
identical range:

| Name | Range | COD |
|---|---|---|
| Bengaluru City | 560001–560999 | **true** |
| bengalor whitefield | 560001–560999 | **false** |
| Bengaluru Rural & Ring Towns | 561001–562999 | true |

The second row overlaps the first exactly, and it wins — so **every Bengaluru
PIN code refuses Cash on Delivery**: *"Cash on delivery is not available for
this PIN code."* Found while testing a COD order to 560001.

Bengaluru is your primary market and COD is how much of it pays, so this is
worth checking before launch. Fix in **Admin → Delivery**: either delete the
"bengalor whitefield" row, or narrow it to the PIN codes it is actually meant
to cover. Not touched — I will not edit your delivery rules.

Worth considering separately: the admin lets you create an overlapping range at
all, and which row wins is incidental rather than chosen. Making it refuse an
overlap on save would stop this recurring.

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

## State of play

| | Gap | Status |
|---|---|---|
| G1 | Admin orders + dashboard 500 on every request | **Fixed** `77d7c3d` |
| G2 | Failed request renders as "no data" | **Fixed** `c5fd1d9` |
| G3 | Checkout had no login requirement | **Fixed** `f931d84` |
| G5 | Duplicate zone disables COD across Bengaluru | **Yours** — Admin → Delivery |
| G4 | ₹1 test orders in live data | **Yours** — after production payment is confirmed |

Also confirmed while testing G3: the server re-priced a tampered ₹1 line back
to ₹1,199 before saving. The protection described in §4 of ARCHITECTURE.md
works.
