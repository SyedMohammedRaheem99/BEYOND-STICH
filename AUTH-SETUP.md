# Email & Auth Setup — Beyond Stich

Everything needed to make order emails, password resets and signup OTPs
actually land in the inbox. Follow top to bottom.

---

## 1. Put the credentials in `.env.local`

File: `beyond-stich-store/.env.local` (gitignored — never commit it).

Add these to what's already there:

```bash
# --- Auth ---
# Pre-generated for you. Anyone who knows this value can forge a login
# session, so treat it like a password. Use a DIFFERENT one in production.
NEXTAUTH_SECRET=bZcaq9RelQg9ZOkoOWmK2lUyObLYlxGSqiaRMvTTdy8=
NEXTAUTH_URL=http://localhost:3000

# --- Email (Hostinger SMTP) ---
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hello@beyondstich.com
SMTP_PASS=<the mailbox password>
EMAIL_FROM=Beyond Stich <hello@beyondstich.com>
EMAIL_REPLY_TO=hello@beyondstich.com
ADMIN_ALERT_EMAIL=<your personal address>
EMAIL_PROVIDER=smtp
```

One mailbox (`hello@`) sends and receives everything. It is already the
address published on the contact page and in the SEO schema, so nothing in
the code needs changing. Splitting transactional mail onto a second address
later is a one-line change to `EMAIL_FROM`.

Two things that are easy to get wrong:

- **`SMTP_USER` is the full address**, not `orders`.
- **`EMAIL_FROM` must be on the same domain as `SMTP_USER`.** Sending as
  `@gmail.com` through the Hostinger mailbox breaks SPF/DKIM alignment and
  the message is treated as spoofed regardless of the DNS below.

In production, change `NEXTAUTH_URL` to `https://beyondstich.com` — reset
links are built from it, so leaving it as localhost mails customers a link
pointing at their own machine.

---

## 2. Test the connection

```bash
cd beyond-stich-store
node scripts/test-email.mjs your@gmail.com
```

It authenticates first, then sends. The two steps fail for different reasons,
so the output tells you which one broke.

| Error | Cause |
|---|---|
| `Invalid login` / `535` | Wrong mailbox password, or `SMTP_USER` isn't the full address |
| `timeout` / `ECONNREFUSED` | Wrong port, or a firewall. Try `SMTP_PORT=587` + `SMTP_SECURE=false` |
| `550` / relay denied | `EMAIL_FROM` domain doesn't match the mailbox |

**Send one to Gmail, one to Outlook and one to Yahoo, and open each.** They
filter very differently. Landing in the inbox at all three is the only real
pass. If it lands in spam, that's section 3 — not a code problem.

---

## 3. DNS records — this is what decides inbox vs spam

Roughly 80% of deliverability. Without these, mail is marked as spam no
matter which server sends it.

**Hostinger → hPanel → Domains → `beyondstich.com` → DNS / Nameservers.**

### 3.1 SPF — who may send as this domain

> ⚠️ **Check for an existing SPF record first.** Hostinger usually creates
> one when you add a mailbox. **Two SPF records make both fail.** If one
> exists, edit it — do not add a second.

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `@` |
| Value | `v=spf1 include:_spf.mail.hostinger.com ~all` |

Already have one? Merge the `include:` into the existing record rather than
adding a line. One `v=spf1`, one `~all`, includes in between:

```
v=spf1 include:_spf.mail.hostinger.com include:something-else.com ~all
```

### 3.2 DKIM — cryptographic signature

Hostinger generates this per domain; it is not a value anyone can write for
you.

**hPanel → Emails → `beyondstich.com` → DKIM** (sometimes under *Email
configuration*). Enable it, then copy the `TXT` record it shows into the DNS
zone — usually name `hostingermail._domainkey`.

### 3.3 DMARC — policy *and* your delivery reports

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:hello@beyondstich.com; pct=100; adkim=r; aspf=r` |

`p=none` means "report, don't block" — correct to start with. Tighten to
`p=quarantine` after a few weeks of clean reports.

**`rua=` is the delivery tracking you asked about.** Gmail, Outlook and
Yahoo email daily XML reports to that address: how many messages they got
from your domain, whether SPF/DKIM passed, what they did with them.

Point `rua=` at a mailbox that exists. With a single mailbox, use
`rua=mailto:hello@beyondstich.com` — the reports are machine-readable XML
and arrive roughly daily, so a forwarder or filter rule keeps them out of
the way.

### 3.4 Verify

Wait ~15 minutes, then check at [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx):

- `spf:beyondstich.com` → exactly one record
- `dkim:beyondstich.com:hostingermail` → found
- `dmarc:beyondstich.com` → found

Then the real test: **[mail-tester.com](https://www.mail-tester.com)**. It
gives you an address, you send to it, and it scores you out of 10. **Aim for
9+.** It lists exactly what's wrong — far more useful than guessing.

---

## 4. Delivery tracking

Three layers, since shared hosting has no dashboard.

**SMTP logs** — every send is written to the `EmailLog` collection:
recipient, subject, type, accepted/rejected, message id, error. Catches hard
failures immediately.

**Open tracking** — a 1×1 pixel on non-sensitive mail. When it loads, we know
the message reached an inbox rather than spam. Deliberately **not** on OTP,
password-reset or admin mail — those are credentials.

> Opens undercount (many clients block images). A recorded open proves
> delivery; a missing one proves nothing.

**DMARC reports** — see 3.3. The only source that tells you what Gmail
actually *did* with your mail.

---

## 5. Keeping it out of spam

Already handled in code:

- ✅ Plain-text alternative on every email (HTML-only is a strong spam signal)
- ✅ `Reply-To`, `Auto-Submitted`, `X-Auto-Response-Suppress` headers
- ✅ Pooled connections, so bursts don't trip the host's rate limit
- ✅ Code in the subject line (`123456 is your verification code`)

Operational rules:

1. **Warm up.** A brand-new domain sending hundreds on day one looks like
   spam. Start at ~20–50/day, grow over two weeks.
2. **Never send marketing from this mailbox.** One spam complaint on a promo
   can take your OTPs and order confirmations down with it. When you start
   campaigns, create a separate address for them.
3. **Hostinger's real limits** are ~100/hour and ~3,000/day on shared plans.
4. **Watch bounces.** Repeatedly mailing dead addresses damages reputation.

### If mail still lands in spam

1. Run [mail-tester.com](https://www.mail-tester.com) — it names the problem
2. Confirm all three DNS records (section 3.4)
3. Check there's exactly **one** SPF record
4. Verify `EMAIL_FROM` matches the `SMTP_USER` domain
5. Still stuck? The shared IP's reputation may be the cause — that's outside
   our control. Set `EMAIL_PROVIDER` to a hosted API provider; `lib/mailer.js`
   is built so this needs no code change.

---

## 6. What's in the code

| File | Role |
|---|---|
| `src/lib/mailer.js` | Transport, pooling, text generation, logging, pixel |
| `src/lib/otp.js` | Code generation, hashing, timing-safe compare, cooldown |
| `src/lib/email.js` | The six templates. No transport logic |
| `src/lib/models/EmailLog.js` | Delivery log, 90-day TTL |
| `src/app/api/email/open/[id]/route.js` | Tracking pixel endpoint |
| `scripts/test-email.mjs` | Connection + send test |

Templates: order confirmation · shipping update · password reset · refund ·
admin new-order alert · **signup OTP**.

### Signup verification flow

1. `POST /api/auth/register` — account created **unverified**, code mailed
2. Customer lands on `/verify-email?email=…`
3. `POST /api/auth/verify-email` — code checked; on success guest orders
   placed with that address are attached to the account
4. `POST /api/auth/resend-otp` — new code, 60s cooldown

Rules enforced in code:

- Codes are **SHA-256 hashed at rest**; only the mailed copy is ever plain
- **15-minute** expiry, **5 attempts**, then the code is burned
- Comparison is **timing-safe**
- Wrong code and unknown account return the **same** response, so the
  endpoint can't be used to discover who has registered
- Accounts created before verification existed are **grandfathered** — they
  sign in normally. Only accounts with `emailVerified: false` are gated
- **Google sign-in auto-verifies** (Google already proved the address)

---

## 7. Checklist

- [ ] `.env.local` filled in (section 1)
- [ ] `node scripts/test-email.mjs you@gmail.com` passes
- [ ] Arrived in **Gmail**, **Outlook** and **Yahoo** inboxes
- [ ] SPF added — exactly one record
- [ ] DKIM enabled in hPanel and added to DNS
- [ ] DMARC added, `rua=` points at a mailbox that exists
- [ ] mail-tester.com scores 9+
- [ ] `NEXTAUTH_URL` points at the real domain in production
