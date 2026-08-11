# Getting Found on Google — Joe & Cami's Playbook

This is the plain-English guide to getting Joe's Garage showing up when someone
nearby searches **"mechanic near me"** or **"brake repair Boulder."**

**The single most important thing on this page:** for a local shop, your
**Google Business Profile** — the box with your photo, hours, and reviews that
appears next to the map — brings in more calls than everything else combined.
The website supports it. It does not replace it.

Work through Part 1 and Part 2. Everything after that is bonus points.

---

## What's already done for you

The website was built with the technical side handled, so you don't have to
think about any of it:

| Already built in | What it does |
| --- | --- |
| A page for every service | Someone searching "check engine light Boulder" can land directly on that page |
| Structured business data | Feeds your address, phone, hours, and services straight to Google in the format it reads |
| `sitemap.xml` | The list of pages you're asking Google to index — submit it once (Part 2) |
| `robots.txt` | Invites search engines to the public pages and **keeps them out of customer records and accounting** |
| Fast, mobile-first pages | Speed and mobile usability are both ranking factors — most of your visitors are on a phone |
| Share previews | A proper image + headline when the site gets texted or posted on Facebook |
| Tap-to-call everywhere | On a phone, the number is one tap — this is the whole point of the site |

---

## Part 1 — Fill in the real business details ⚠️ DO THIS FIRST

The website currently ships with **placeholder** contact information. Google
punishes a business whose details don't match across the web, so this has to be
right before anything else.

**File to edit:** `src/lib/site-config.ts`

Replace everything marked `«FILL IN»`:

- **Business name** — exactly as it appears on the sign
- **Phone number** — the number that actually rings at the shop
- **Street address, city, state, ZIP**
- **Email**
- **Hours** — including Saturday, and mark Sunday closed if you're closed
- **Towns you serve** — the surrounding communities customers drive in from
- **Year the shop opened**
- **Map coordinates** — open Google Maps, right-click the shop, click the
  numbers to copy them
- **`trust` section** — ⚠️ only claim what's actually true. If you don't offer a
  24-month warranty, change it or delete that line.

> **The golden rule of local SEO:** your **N**ame, **A**ddress, and **P**hone —
> "NAP" — must be **identical everywhere**: the website, Google, Facebook, Yelp,
> your invoices. Not "Street" here and "St." there. Pick one way of writing it
> and never vary.

Also worth personalizing (marked in the file): the **About page** copy. Google
and customers both reward a real story over generic filler.

---

## Part 2 — Set up your Google Business Profile

This is the free listing that puts you on Google Maps and in the local results.
Budget about 45 minutes.

### 2a. Create or claim it

1. Go to **google.com/business** and sign in with the shop's Google account
   (create one just for the business if you don't have it — don't use a personal
   account you might lose access to).
2. Search for "Joe's Garage" first. If a listing already exists — Google
   sometimes creates them automatically — click **Claim this business** rather
   than making a duplicate. **Duplicate listings hurt you.**
3. Otherwise choose **Add your business**.

### 2b. Fill it in

| Field | What to put |
| --- | --- |
| **Business name** | Exactly what's on the sign. Don't stuff keywords ("Joe's Garage Best Auto Repair Boulder") — Google suspends listings for this. |
| **Primary category** | **Auto Repair Shop** — this one choice matters more than almost anything else |
| **Additional categories** | Add what genuinely applies: Brake Shop, Oil Change Service, Auto Tune Up Service, Car Repair and Maintenance Service, Diagnostic Center, Tire Shop |
| **Address** | The exact same format as `site-config.ts` |
| **Service area** | The towns from your config — add them so you appear in nearby searches |
| **Hours** | Same as the website. Also set **special hours** for holidays |
| **Phone** | The shop's main line, matching the website |
| **Website** | Your domain (see Part 3) |
| **Services** | Add each service from the site as an individual entry with a short description — this is a big, commonly-skipped win |
| **Attributes** | Check everything true: appointments required/accepted, wheelchair accessible, restroom, LGBTQ+ friendly, veteran-owned, etc. |
| **Description** | 750 characters. Lead with what you do and where: *"Joe's Garage is a locally owned auto repair shop in Boulder, CO, serving drivers since 1998…"* |
| **Opening date** | The year the shop opened |

### 2c. Photos — do not skip this

Listings with photos get dramatically more calls and direction requests.
Upload at least **10 real photos** (phone camera is fine — real beats polished):

- The building from the street, so people recognize it when they arrive
- Your sign
- The bays, a lift, the waiting area
- Joe, Cami, and the crew (faces build enormous trust)
- A few cars up on the lift, mid-repair
- Your logo as the profile photo, storefront as the cover photo

Add a few new photos every month. Google reads an active listing as a live business.

### 2d. Verify

Google will verify by postcard, phone, email, or video, depending on the
business. **Postcard takes 1–2 weeks — order it and don't request a second one**,
which resets the clock. You're not visible in local results until this is done.

---

## Part 3 — Point your domain at the site

1. Buy the domain (Namecheap, Google Domains/Squarespace, GoDaddy — any is fine).
   `joesgarage.com` or `joesgaragebolder.com` — short and speakable wins.
2. In **Vercel → your project → Settings → Domains**, add it and follow the DNS
   instructions Vercel gives you.
3. Set `NEXT_PUBLIC_SITE_URL` in **Vercel → Settings → Environment Variables** to
   the final address (e.g. `https://joesgarage.com`, no trailing slash), then
   redeploy. This makes the sitemap and search data point at the right place.
4. Put that same address in your Google Business Profile.

---

## Part 4 — Tell Google the site exists

1. Go to **search.google.com/search-console**.
2. Add your domain and verify it (the DNS record method is easiest — Vercel has
   a place to paste it).
3. Open **Sitemaps** in the sidebar and submit: `sitemap.xml`
4. Open **URL Inspection**, paste your homepage, and click **Request indexing**.

Then leave it alone. Indexing takes days to a couple of weeks. Checking daily
won't speed it up.

**Bonus, 5 minutes:** do the same at **bing.com/webmasters**. Bing powers other
places, and almost no local shop bothers — free visibility.

---

## Part 5 — Reviews (the real ranking lever)

After the Business Profile itself, **reviews are the biggest factor** in whether
you outrank the shop down the street. Quantity, recency, and your replies all count.

**How to actually get them:**

1. In your Google Business Profile, find **Ask for reviews** → copy your short
   review link. It looks like `g.page/r/xxxxx/review`.
2. Ask **at the moment of handoff**, when the customer is happiest: *"If we did
   right by you, a Google review really helps a small shop like ours."*
3. Text the link. Put it on the invoice. Print a small card for the counter with
   a QR code.
4. **Never** offer a discount or anything of value for a review — it violates
   Google's policy and can get your reviews wiped.

**Reply to every single review**, good or bad, within a few days:

- **Good:** thank them and mention the specific repair — *"Thanks Dave! Glad the
  A/C is blowing cold again before the heat hits."*
- **Bad:** stay calm, never argue, apologize for the experience, and move it
  offline — *"I'm sorry we let you down. That's not how we do business — please
  call me at the shop so I can make it right. — Joe."* Future customers are
  reading how you handle criticism far more closely than the complaint itself.

> The app can help here: the **Follow-Ups** page shows who you've just finished
> work for, so asking for a review can become part of the same call.

---

## Part 6 — Get listed everywhere else

Every other place your NAP appears consistently is another vote of confidence.
Set these up once, with **identical** name/address/phone:

- **Apple Maps** — `mapsconnect.apple.com` (iPhone users searching "mechanic near me")
- **Facebook** — a business Page with hours, address, and a link to the site
- **Yelp** — claim the listing even if you don't love Yelp; it ranks well
- **Bing Places** — `bingplaces.com`
- **Nextdoor** — a business page; neighborhood recommendations drive real local work
- **Better Business Bureau** — optional, but trusted by older customers
- **NAPA / parts-network shop locators** — if you're affiliated, get listed
- **Local chamber of commerce** — a genuine local link, which is worth more than
  a hundred junk directory links

⚠️ **Skip anyone who cold-calls offering to "fix your Google listing" for a
monthly fee.** It's the most common scam aimed at small shops. Everything in this
guide is free and takes an afternoon.

---

## Part 7 — Keep it alive (about 20 minutes a month)

Local rankings reward activity. A recurring monthly habit:

- [ ] Post an update on your Google Business Profile (a seasonal reminder, a
      recent job, a service special) — takes 2 minutes and Google notices
- [ ] Add 2–3 new photos
- [ ] Reply to every new review
- [ ] Answer any new questions in the profile's **Q&A** section — you can also
      post your own common questions and answer them yourself
- [ ] Check hours are still right, especially before holidays
- [ ] Glance at Search Console for anything flagged

**Twice a year:** re-read the website copy. If you add a service, add it to
`src/lib/site-config.ts` — a new page, sitemap entry, and search data are
generated automatically.

---

## The honest expectations

- **Google Business Profile:** calls can start within days of verification.
- **The website ranking:** 2–6 months to settle in for competitive searches like
  "mechanic Boulder." Longer-tail pages ("pre-purchase inspection Boulder") come
  in faster because fewer shops bother to make them — which is exactly why we
  built a page per service.
- **Reviews compound.** A shop with 60 reviews at 4.8 stars beats a shop with 6,
  almost regardless of anything else on this page.

Nobody can promise a #1 ranking, and anyone who does is selling something. What
you can control is being accurate, being complete, being active, and being worth
reviewing well. That's most of the game for a local shop.
