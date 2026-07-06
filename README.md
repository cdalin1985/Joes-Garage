# Joe's Garage — Shop Management Platform

An all-in-one web app to run an independent auto-repair shop: customers &
vehicles (CRM), estimates, invoices & payments, work orders, parts inventory,
appointments, and accounting with tax-time reporting. Built for **Joe plus a
small team** with role-based access.

> Stack: **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
> (Postgres + Auth) · deployable to Vercel**

> 👉 **Joe & Cami — start here:** the [Welcome Letter](docs/WELCOME_LETTER.md)
> is the two-minute tour of what this replaces and why you'll like it. Then the
> [Owner & Admin Setup and Migration Guide](docs/ONBOARDING.md) is the
> non-technical, step-by-step checklist for going live and moving off
> NAPA TRACS + QuickBooks + Accounting Link. For a print-and-check-off
> version to keep at the desk, see the [Quick Start](docs/QUICKSTART.md).

---

## What's inside

| Area | Features |
| --- | --- |
| **Dashboard** | Role-aware KPIs (month income/expense/net, A/R), open work orders, invoices needing payment, quick actions |
| **Customers (CRM)** | Individuals, fleet & commercial accounts, contacts, lifetime value, open balance, full history |
| **Vehicles** | Year/make/model/trim, VIN, plate, mileage, engine/trans/drivetrain, per-vehicle service history |
| **Estimates** | Line items (labor/parts/fees/discounts), tax, customer concern, send → approve/decline → **convert to invoice** |
| **Invoices** | Auto-numbered, tax, partial payments, balance tracking, auto status (paid/partial/overdue), printable |
| **Payments** | Cash/card/check/ACH/financing, payment history, automatic invoice reconciliation |
| **Work Orders** | Intake → in progress → awaiting parts/approval → completed → delivered, tech assignment, odometer, diagnosis, **invoice from WO** |
| **Parts & Inventory** | Catalog, cost vs price, on-hand qty, reorder alerts, drop onto any document |
| **Appointments** | Scheduling book grouped by day |
| **Accounting & Tax** | Expense ledger, IRS Schedule‑C category mapping, P&L, sales-tax-collected, tax-time summary |
| **Staff** | Roles: Owner / Admin / Mechanic / Front Desk with enforced permissions |
| **Settings** | Shop info, default tax & labor rates, document prefixes & terms, tax IDs |

Financial data (accounting, reports, settings, staff) is restricted to
**Owner/Admin**; everyone else works the front-of-house modules. All access is
enforced at the database level with Postgres **Row Level Security**.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project & apply the schema

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates
   every table, view, trigger, and security policy.
3. *(Optional)* Run [`supabase/seed.sql`](supabase/seed.sql) the same way to load
   realistic demo data (sample customers, vehicles, invoices, a work order, and
   expenses) so you can explore every screen.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 4. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, choose **Create account**, and sign up. **The
first account automatically becomes the shop Owner.** Add staff later from the
**Staff** page (they self-register, then you set their role).

> **Auth note:** by default Supabase emails a confirmation link on sign-up. For a
> friction-free internal tool you can turn this off under
> **Authentication → Providers → Email → "Confirm email" (off)** so accounts are
> active immediately.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   Environment Variables.
4. Deploy. Supabase already runs in the cloud, so nothing else is required.

---

## Project structure

```
src/
  app/
    (app)/                 Authenticated area (sidebar shell)
      dashboard/ customers/ vehicles/ estimates/ invoices/
      work-orders/ parts/ appointments/ accounting/ settings/ staff/
    login/  setup/         Public pages
    middleware.ts          Session refresh + route protection
  components/              UI primitives, nav, forms, document views
  lib/
    actions/               Server Actions (mutations) per module
    supabase/              Browser/server/middleware clients
    database.types.ts      Domain types (mirror of the schema)
    auth.ts constants.ts format.ts display.ts queries.ts
supabase/
  migrations/              Versioned SQL (source of truth)
  schema.sql               All migrations combined for one-paste setup
  seed.sql                 Optional demo data
```

## How the money math works

Invoice and estimate totals are computed **in the database** by triggers:
editing a line item, changing the tax rate, or recording a payment
automatically recalculates subtotal, tax, total, amount paid, balance, and
status. The app never has to keep these in sync by hand, which keeps the books
trustworthy. Reporting is **cash-basis** (income counts when collected) — the
simplest and most common basis for a small shop.

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```
