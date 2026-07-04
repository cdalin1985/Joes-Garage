# Joe's Garage — Owner & Admin Setup and Migration Guide

This guide is written for **Joe (Owner)** and **Cami (Admin)**. It walks you
through getting the app live, moving over what you have today in **NAPA TRACS +
QuickBooks + Accounting Link**, and a checklist to confirm nothing was missed.

You do **not** need to be technical to follow Part 2 onward. Part 1 (the one-time
technical setup) is best done by whoever deploys the app; after that, everything
is point-and-click inside the app.

---

## What this app replaces

| You have today | What it did | In this app |
| --- | --- | --- |
| **NAPA TRACS** | Shop management — customers, vehicles, estimates, work orders, parts, inspections, labor guide | Customers, Vehicles, Estimates, Work Orders, Parts & Inventory, Digital Inspections, Labor Rate Book |
| **QuickBooks** | Bookkeeping — income, expenses, sales tax, tax prep | Invoices & Payments, Accounting (expense ledger), Reports & Tax, Tax Center |
| **Accounting Link** | The bridge that copied TRACS tickets into QuickBooks | **No longer needed.** Invoicing and bookkeeping live in one system, so there is nothing to sync. |

> The big win: **one system, no nightly sync, no double entry.** When you invoice
> a customer, the income, sales tax, and A/R are already in the books.

---

## Part 1 — One-time technical setup (go-live)

Do this once. Budget ~30 minutes.

### 1.1 Create the database (Supabase)
1. Create a free project at [supabase.com](https://supabase.com). Pick a strong
   database password and save it in a password manager.
2. In the Supabase dashboard: **SQL Editor → New query**.
3. Open [`supabase/schema.sql`](../supabase/schema.sql) from this repo, copy the
   **entire** contents, paste into the query box, and click **Run**. This builds
   every table, view, trigger, and security rule — including the Tax Center,
   purchase orders, labor rate book, inspections, and communications log.
4. *(Optional, recommended for a test run)* Run [`supabase/seed.sql`](../supabase/seed.sql)
   the same way to load sample data so you can click around before entering real
   customers. **Do not run the seed on the database you'll use for real.**

### 1.2 Make sign-up frictionless
In Supabase: **Authentication → Providers → Email** and turn **"Confirm email"
OFF**. This lets you and Cami sign in immediately without clicking an email link.
(For an internal shop tool this is the normal choice.)

### 1.3 Deploy the app (Vercel)
1. The code is already on GitHub on branch `claude/frontend-design-modernize-d8sb6x`
   (see Part 5 about merging it to `main` first).
2. Import the repo in [vercel.com](https://vercel.com).
3. Add two **Environment Variables** (from Supabase **Project Settings → API**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. That's it — Supabase already runs in the cloud.

### 1.4 Create the Owner and Admin accounts
1. Open the deployed site and choose **Create account**.
2. **Joe signs up first.** The very first account automatically becomes the
   **Owner** with full access.
3. Have **Cami** open the site and choose **Create account** too. She'll start as
   Front Desk.
4. Joe goes to **Staff**, finds Cami, sets her **Role = Admin**, and saves. Admin
   gives her accounting, reports, settings, and staff management — everything the
   books need.
5. Add any mechanics / front-desk staff the same way (they self-register, you set
   the role and pay rate).

> **Roles in one line:** Owner/Admin = everything incl. money & taxes.
> Mechanic/Front Desk = customers, vehicles, estimates, invoices, work orders —
> no financial reports.

### 1.5 Enter shop settings
Go to **Settings** and fill in:
- Shop name, address, phone, email
- **Default sales-tax rate** (so invoices tax correctly)
- **Default labor rate** ($/hour — used by estimates, invoices, and the labor book)
- Document number prefixes & terms (e.g. invoice/estimate numbering)
- Tax IDs (EIN / state)

Then open **Reports & Tax → Tax Center → Business & Tax Profile** and complete the
intake (entity type, filing status, prior-year figures, home office, vehicle,
retirement/health). This powers the auto-filled Schedule C and quarterly estimates.

---

## Part 2 — Get your data out of the old systems

Pull these exports **before** you start entering anything. Most can be exported to
CSV/Excel and used as a checklist while you type into the new app.

### From QuickBooks
- **Customer list** (Reports → Customer Contact List) — names, addresses, phone,
  email, tax-exempt status, and any open balances.
- **Vendor list** (Reports → Vendor Contact List) — your parts suppliers; note any
  you pay $600+/yr that need a **1099** and whether you have their **W-9**.
- **Open invoices / A/R Aging** — anything customers still owe you (open balances).
- **Expense history / P&L by category** for the current year — so the Tax Center
  Schedule C reflects expenses already incurred this year.
- **Sales-tax rate(s)** you charge.

### From NAPA TRACS
- **Customer & vehicle list** — especially vehicles with **VIN, plate, mileage,
  and engine** (the app can re-decode a VIN for you, see 3.2).
- **Parts / inventory** — part number, description, **cost**, **price**, on-hand
  quantity, and reorder point.
- **Canned jobs / labor guide** — your common jobs with standard hours (these
  become the **Labor Rate Book**).
- **Open repair orders** — any vehicles currently in the shop / mid-job.

> Tip: keep the spreadsheets open side-by-side with the app. There's no automated
> importer in v1 — entry is manual, which is also a good moment to clean out dead
> customers and stale parts.

---

## Part 3 — Enter your data (do it in this order)

Order matters because later records link to earlier ones (a vehicle needs a
customer; an invoice needs both).

1. **Staff** *(Part 1.4)* — Owner, Admin, mechanics.
2. **Settings** *(Part 1.5)* — tax rate, labor rate, shop info.
3. **Customers** — from your QuickBooks/TRACS customer list. Mark fleet/commercial
   accounts and anyone **tax-exempt**.
4. **Vehicles** — under each customer. Enter the VIN and use the **VIN decoder**
   (see 3.2) to auto-fill year/make/model/engine, then add plate & mileage.
5. **Vendors** (Accounting / Parts → suppliers) — your parts suppliers. For anyone
   you'll send a **1099**, record their W-9 details and mark them in the Tax
   Center → 1099 contractors area.
6. **Parts & Inventory** — part #, description, cost, price, on-hand, reorder
   point. This drives low-stock reorder suggestions and purchase orders.
7. **Labor Rate Book** (CRM → Labor Rate Book) — enter your common canned jobs with
   default hours and (optionally) a rate. These become one-click line items on
   estimates and invoices.
8. **Open balances** — for customers who owe you, create an invoice reflecting the
   outstanding amount (or enter the original invoice and record partial payments)
   so your A/R matches QuickBooks on day one.
9. **Open work orders** — for any vehicle currently in the shop, open a Work Order
   and set its status (intake / in progress / awaiting parts, etc.).

### 3.2 Using the VIN decoder (saves a lot of typing)
On a vehicle's form, paste the **VIN** and click decode — the app calls the free
government NHTSA database and fills in year, make, model, and engine. You just add
plate and mileage. Great for bulk-entering a customer's fleet.

---

## Part 4 — Feature crosswalk (where did my old screen go?)

| Old workflow | Where it lives now |
| --- | --- |
| TRACS estimate / ticket | **Estimates** → approve → **Convert to invoice** |
| TRACS repair order | **Work Orders** (with the visual **Board** view) → **Invoice from WO** |
| TRACS inspection sheet | **Work Order → Inspection** (Digital Vehicle Inspection) with a **shareable customer link** — no login needed for the customer |
| TRACS parts ordering | **Parts → Purchase Orders** (draft → ordered → received) + low-stock reorder suggestions |
| TRACS labor guide / canned jobs | **Labor Rate Book** |
| Customer call notes | **Customer → Communications log** |
| Tech productivity | **Staff → Tech Performance** (billed hours, revenue, gross margin) |
| QuickBooks invoice & payment | **Invoices** + **Payments** (auto A/R, auto status) |
| QuickBooks expenses | **Accounting** expense ledger (Schedule-C categories) |
| QuickBooks sales-tax report | **Reports & Tax** (sales tax collected) |
| QuickBooks / accountant at tax time | **Tax Center** — auto Schedule C, quarterly estimates, mileage, depreciation, 1099s |
| **Accounting Link sync** | **Gone** — nothing to sync; invoicing *is* the bookkeeping |

---

## Part 5 — Hand-off checklist for the PR

The work is on a pull request (**PR #3**) that's currently a **draft**. To hand the
finished app to Joe & Cami:

- [ ] **Apply the database first.** Run `supabase/schema.sql` on the real Supabase
      project (Part 1.1). The app code is deployed by Vercel, but the new tables
      (Tax Center, purchase orders, labor presets, inspections, communications)
      only exist after you run the schema. Doing this *before* merging avoids the
      app loading against a database that's missing tables.
- [ ] **Confirm the preview works.** PR #3 has a Vercel **Preview** link that built
      successfully — click through Customers, Work Orders, Invoices, Tax Center.
- [ ] **Mark the PR "Ready for review"** (it's a draft today), then **merge it to
      `main`** so Vercel's production deployment picks it up.
- [ ] **Point production Vercel at the real Supabase project** (the two env vars in
      Part 1.3), not a test one.
- [ ] **Create Joe's account first** (becomes Owner), then **Cami's**, then set Cami
      to **Admin** (Part 1.4).
- [ ] **Fill in Settings + Tax Profile** (Part 1.5).
- [ ] **Enter data in order** (Part 3) — or do a 1–2 week **parallel run** (keep the
      old system as a safety net while you key everything in).

---

## Part 6 — Going-live verification (smoke test)

Click through these once with real settings to confirm everything's wired:

- [ ] Create a **customer**, add a **vehicle** with a VIN (decoder fills it in).
- [ ] Create an **estimate**, add a part and a **canned labor job**, check the tax
      total looks right, **convert it to an invoice**.
- [ ] **Record a payment** on that invoice and confirm the balance and status update
      automatically, and that it shows on the **Dashboard** A/R.
- [ ] Open a **work order**, run a **digital inspection**, open the **share link** in
      a private browser window (it should load without logging in).
- [ ] Create a **purchase order**, mark a part **received**, confirm on-hand qty.
- [ ] As **Cami (Admin)**: open **Reports & Tax** and the **Tax Center** Schedule C —
      confirm income/expenses appear and the numbers look sane.
- [ ] As a **mechanic** account: confirm Accounting/Reports/Settings are hidden.
- [ ] Check **Staff → Tech Performance** shows billed hours after a completed WO.

If all of those pass, you're ready to retire TRACS, QuickBooks, and Accounting Link.

---

## A note on limits (so there are no surprises)

These need paid third-party services and are **not** in this version — they're a
future roadmap item, called out so Joe & Cami know to keep a process for them:

- **Online card payments** on invoices (would need Stripe).
- **Automatic bank feeds** (would need Plaid) — expenses are entered manually today.
- **Payroll tax filing** and **IRS e-file** — the Tax Center *prepares* the numbers
  and a printable Schedule C to hand to a preparer; it does not file for you.

Every tax figure is labeled a **planning estimate** — confirm with a tax
professional before filing.

---

## Part 7 — Shop PIN sign-in (optional, for Joe & Cami)

Instead of typing an email and password every time, the app can show a friendly
**PIN pad**: Joe taps his PIN and he's in; Cami taps hers. It stays secure — the
PIN sits *in front of* a real sign-in, the actual passwords live only in Vercel's
server settings (never in the browser), and all your financial/tax data stays
protected. Anyone who finds the web address still hits the PIN wall.

**Turn it on (one time):**

1. **Create the two accounts** (if you haven't already). On the sign-in page add
   `?staff=1` to the address (e.g. `.../login?staff=1`) to get the email/password
   screen, choose **Create account**, and make **Joe's** account first (he becomes
   Owner), then **Cami's**. Sign in as Joe → **Staff** → set **Cami = Admin**.
   Write down each email and the exact password.
   *(If Supabase emails a confirmation link, turn that off first: Supabase →
   Authentication → Providers → Email → "Confirm email" OFF.)*
2. **Pick a 6-digit PIN** for each person (easier than a password, harder to guess
   than 4 digits).
3. **Add the config in Vercel** → your project → **Settings → Environment
   Variables**. Add one variable named **`SHOP_PINS`** with this value (swap in the
   real emails, passwords, and PINs):

   ```json
   [{"name":"Joe","pin":"482716","email":"joe@joesgarage.com","password":"JoesRealPassword"},{"name":"Cami","pin":"159034","email":"cami@joesgarage.com","password":"CamisRealPassword"}]
   ```

   Set it for **Production**, save, then **Redeploy** (Deployments → ⋯ → Redeploy).

That's it — the next visit shows the PIN pad.

**Good to know**
- **Escape hatch:** the email/password screen is always one tap away via the
  **"Staff sign-in"** link under the keypad — handy if a PIN is forgotten or you
  need to manage accounts.
- **Change a PIN:** edit the `SHOP_PINS` value in Vercel and redeploy. **Turn it
  off:** delete the variable.
- **Security note:** a short PIN is easier to guess than a password. Six digits
  plus the built-in wrong-PIN delay is a good balance for a two-person shop; the
  full email/password path always remains available.
- Signing out returns to the PIN pad.
