# Work plan — 22 items from 2026-11-25

Each item below was checked against the code before being sized. Where the
reported symptom and the actual cause differ, the cause is stated.

**Reading the sizes:** S = under an hour · M = half a day · L = a day or more.

---

## Phase 1 — Bugs and quick wins (do first)

These are small, independent, and several are visibly wrong right now.

| # | Item | Cause found | Size |
|---|---|---|---|
| 1 | **Admin banner images broken** | Not a bug in the admin. All 7 banner rows store `/banners/hero/*.webp`, which are files in the **store's** `public/`. The admin is a separate app on :3001 and has no such folder, so they 404 there. | S |
| 2 | **Navbar: icon sits under the hover circle** | `.actionBtn:hover` paints a background on the button; the SVG inside has no stacking context, so it can fall behind the fill. Needs the icon raised, not the circle lowered. | S |
| 3 | **Navbar transparency on scroll** | `.navbar` starts `background: transparent` and only gains `rgba(10,10,10,0.85)` + blur once `.scrolled` applies. Over a bright hero slide the text is unreadable until you scroll. | S |
| 4 | **About → footer, add Home to navbar** | `/about` is a navbar link (Navbar.jsx:155) and absent from the footer. Home has no link at all — only the logo. | S |
| 5 | **Segment "worlds" dots → icons** | The round colour dots come from each segment's `accent` in constants. Replacing with icons means adding an icon per segment. | S |
| 6 | **Latest Drop editable from admin** | Currently a hardcoded "6 newest active products" query in `page.js:28`. | S |

**Note on #1:** two ways to fix. Either copy the banner files into the admin's
`public/` (duplication, drifts), or re-upload them through the admin so every
banner is a Cloudinary URL that both apps can reach (one source of truth). I
recommend the second — it is also what the Add Slide form already does for new
uploads.

---

## Phase 2 — Visual direction

Grouped because they are the same conversation: how the site should feel.

| # | Item | Reality | Size |
|---|---|---|---|
| 7 | **"RGB feel" is wrong outside gamer** | Each segment carries its own `accent` — `#9B5DE5` purple, `#00FF94` neon green, `#F5C518` gold. Neon green on a floral or coffee page reads as gaming, not premium. | M |
| 8 | **Worlds cards: crisp → smoother transition** | Easing/duration on the segment tiles. | S |
| 9 | **Light mode** | **There is no light mode anywhere** — zero `prefers-color-scheme` or `data-theme` rules in `globals.css`. Every colour is a dark-theme literal. | **L** |

**My recommendation on #7:** keep one premium accent (your gold) site-wide and
let each segment express itself through photography and copy, not a different
neon per page. Gaming can keep its accent as the deliberate exception. This is
a smaller change than it sounds and it is what makes a brand read as premium
rather than as a template.

**My recommendation on #9:** do this *last*, or not before launch. It is not a
toggle — it means auditing every hardcoded colour in the store and defining a
second palette. Done hastily it looks broken in a way the dark theme never
did. Nothing else on this list depends on it.

---

## Phase 3 — Admin control (the "no hard-coding" theme)

This is the largest group and the most valuable, because it is what stops you
needing me for routine changes.

| # | Item | Reality | Size |
|---|---|---|---|
| 10 | **Segments: add / remove / edit from admin** | `SEGMENTS` is a hardcoded array of 13 in `constants.js`, duplicated in both apps. **There is no Segment model.** Products reference segments by an enum, and `/segment/[name]` pages are driven by the constant. | **L** |
| 11 | **Every product field editable from admin** | Partly done already (product types shipped). Needs an audit of what is still fixed. | M |
| 12 | **Section placement anywhere on a page** | `HomeSection` already has `sortOrder`, but sections always render in one fixed slot between Latest Drop and the segment grid. Needs a `position` concept (e.g. above/below hero). | M |
| 13 | **Reviews: add, edit, photos + video, change rating** | Admin can only approve/reject and delete — there is **no create or edit**. The model supports up to 5 images; **video is not supported at all** and needs schema + upload + player work. | **L** |
| 14 | **Cards adding section — segments** | Overlaps #10 and #12; scope once those are decided. | M |

**Sequencing note:** #10 is the backbone. Segments touch products, navigation,
the segment grid, `/segment/[name]` pages and the admin product form. Doing
#12 or #14 before it means building against a constant that is about to
become a collection. **Do #10 first in this phase.**

**On #13 video:** video is a real cost — storage, transcoding, a player, and
moderation of customer uploads. Worth confirming you want customer *video*
reviews, or whether admin-added photos are enough for launch.

---

## Phase 4 — Needs investigation before it can be sized

I will not guess at these.

| # | Item | What I need |
|---|---|---|
| 15 | **OTP "needs checking properly"** | Which part failed — not arriving, arriving late, rejected when correct, or resend? The flow has tests, so a specific symptom will find it fast. |
| 16 | **Sign-in after registration / forgot-password OTP** | Reads as: OTP should not be demanded again at forgot-password, since the reset link already proves email ownership. Confirm and it is Phase 1 sized. |
| 17 | **Hero sliding images on other devices** | Which device and what breaks — wrong crop, not sliding, or cut off? Mobile crops exist, so this may be one breakpoint. |
| 18 | **Mouse hover not working on laptop** | Possibly the same root cause as #2. Worth testing after #2 lands before treating it as separate. |
| 19 | **Colour variant shifts product image** | Known and previously deferred. Products have `colors[]` but images are not keyed to colour — needs a model change. Size: **M–L**. |

---

## Suggested order

1. **Phase 1** — six quick fixes, visible immediately. Start with #1, #2, #3.
2. **#16 and #15** — auth correctness. Small, and they affect every customer.
3. **#10 (segments to the database)** — unblocks the rest of Phase 3.
4. **Remaining Phase 3** — #12, #14, #11, then #13.
5. **#7 (colour direction)** — before launch; it changes how the brand reads.
6. **#19 (colour variants)**, then **#9 (light mode)** last.

---

## What I would push back on

- **Light mode (#9) before launch.** High effort, no revenue, and it risks
  making a currently-coherent dark site look half-finished.
- **Video reviews (#13).** Confirm the need first; photos may be enough.
- **Doing #12/#14 before #10.** Guarantees rework.

Everything else on this list I agree with.
