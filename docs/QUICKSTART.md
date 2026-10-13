# Joe's Garage — Quick Start (Print Me)

A one-page checklist for going live and moving off NAPA TRACS + QuickBooks +
Accounting Link. Full details: [`docs/ONBOARDING.md`](ONBOARDING.md).
**Keep TRACS & QuickBooks running until Stage 4 passes (1–2 week parallel run).**

---

## Stage 1 — Make it live (one-time, ~30 min)

- [ ] **Database** — Supabase → SQL Editor → New query → paste all of
      `supabase/schema.sql` → **Run**. *(Do NOT run `seed.sql` on the real database.)*
- [ ] **Logins** — Supabase → Authentication → Providers → Email → **"Confirm email" OFF**.
- [ ] **Joe** creates his account first → he becomes **Owner** automatically.
- [ ] **Cami** creates her account → Joe opens **Staff** → sets Cami to **Admin**.
- [ ] **Settings** — shop info, **sales-tax rate**, **default labor rate**, numbering.
- [ ] **Tax Center** — Reports & Tax → Tax Center → **Business & Tax Profile** → fill in.

## Stage 2 — Export from old systems (gather first)

- [ ] **QuickBooks** — Customer list · Vendor list · A/R Aging (who owes you) ·
      this year's P&L by category · sales-tax rate.
- [ ] **NAPA TRACS** — customers + vehicles (**VIN, plate, mileage**) · parts
      (part #, **cost**, **price**, on-hand, reorder point) · canned jobs · open ROs.

## Stage 3 — Enter data **in this order** (later items link to earlier)

1. [ ] **Staff**
2. [ ] **Settings** *(from Stage 1)*
3. [ ] **Customers** — mark fleet & **tax-exempt** ones
4. [ ] **Vehicles** under each customer — paste **VIN → decode** to auto-fill,
       then add plate + mileage
5. [ ] **Vendors** — flag anyone needing a **1099**
6. [ ] **Parts & Inventory**
7. [ ] **Labor Rate Book** — your canned jobs
8. [ ] **Open balances** — invoice what customers still owe (so A/R matches QuickBooks)
9. [ ] **Open work orders** — anything currently in the shop

## Stage 4 — Verify, then retire the old stack

- [ ] Customer + vehicle (VIN decoder works)
- [ ] Estimate with a part + a canned labor job → **convert to invoice**
- [ ] **Record a payment** → balance, status, and Dashboard A/R update automatically
- [ ] Work order → **digital inspection** → open **share link in a private window**
      (loads with no login)
- [ ] **Purchase order** → mark a part **received** → on-hand updates
- [ ] As **Cami (Admin)**: Tax Center → **Schedule C** numbers look right
- [ ] As a **mechanic** account: Accounting / Reports / Settings are hidden

**All pass → turn off TRACS, QuickBooks, and Accounting Link.**

---

### Who does what
- **Cami (Admin):** Settings, Tax Profile, vendors/1099s, open balances, accounting checks.
- **Either:** customers, vehicles (VIN decode is fast), parts, labor book.

### Not included yet (keep a process for these)
Online card payments (Stripe) · automatic bank feeds (Plaid) · IRS e-file.
The Tax Center **prepares** a printable Schedule C + estimates to hand a preparer —
it does not file. Every tax figure is a **planning estimate**; confirm with a tax pro.
